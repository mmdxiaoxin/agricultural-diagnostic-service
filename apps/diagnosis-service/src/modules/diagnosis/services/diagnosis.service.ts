import {
  AiService,
  DiagnosisHistory,
  File as FileEntity,
} from '@app/database/entities';
import { StartDiagnosisDto } from '@common/dto/diagnosis/start-diagnosis.dto';
import { DiagnosisConfig } from '@common/types/diagnosis';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { DOWNLOAD_MESSAGE_PATTERNS } from '@shared/constants/download-message-patterns';
import { FILE_MESSAGE_PATTERNS } from '@shared/constants/file-message-patterns';
import { Status } from '@shared/enum/status.enum';
import { formatResponse } from '@shared/helpers/response.helper';
import {
  DOWNLOAD_SERVICE_NAME,
  FILE_SERVICE_NAME,
} from 'config/microservice.config';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { DataSource, In, Repository } from 'typeorm';
import { DiagnosisHttpService } from './diagnosis-http.service';

@Injectable()
export class DiagnosisService {
  private readonly logger = new Logger(DiagnosisService.name);

  constructor(
    @InjectRepository(DiagnosisHistory)
    private readonly diagnosisRepository: Repository<DiagnosisHistory>,
    @Inject(FILE_SERVICE_NAME)
    private readonly fileClient: ClientProxy,
    @Inject(DOWNLOAD_SERVICE_NAME)
    private readonly downloadClient: ClientProxy,
    private readonly dataSource: DataSource,
    @InjectRepository(AiService)
    private readonly aiServiceRepository: Repository<AiService>,
    private readonly diagnosisHttpService: DiagnosisHttpService,
  ) {}

  // 初始化诊断数据
  async createDiagnosis(userId: number, fileId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const diagnosisHistory = queryRunner.manager.create(DiagnosisHistory, {
        createdBy: userId,
        updatedBy: userId,
        status: Status.PENDING,
      });
      diagnosisHistory.fileId = fileId;
      await queryRunner.manager.save(diagnosisHistory);
      await queryRunner.commitTransaction();
      return formatResponse(200, diagnosisHistory, '上传成功');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new error();
    } finally {
      await queryRunner.release();
    }
  }

  // 开始诊断数据
  async startDiagnosis(
    diagnosisId: number,
    userId: number,
    dto: StartDiagnosisDto,
    token: string,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const diagnosis = await queryRunner.manager.findOne(DiagnosisHistory, {
        where: { id: diagnosisId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!diagnosis) {
        throw new RpcException({
          code: 500,
          message: '未找到诊断记录',
        });
      }
      if (diagnosis.createdBy !== userId) {
        throw new RpcException({
          code: 500,
          message: '无权限操作此记录',
        });
      }
      diagnosis.status = Status.IN_PROGRESS;
      await queryRunner.manager.save(diagnosis);

      // 获取服务配置
      const aiService = await this.aiServiceRepository.findOne({
        where: { serviceId: dto.serviceId },
        relations: ['aiServiceConfigs'],
      });

      if (!aiService) {
        throw new RpcException({
          code: 500,
          message: '未找到AI服务配置',
        });
      }

      // 构建配置
      const config: DiagnosisConfig = {
        baseUrl: aiService.endpointUrl,
        urlPrefix:
          aiService.aiServiceConfigs.find(
            (config) => config.configKey === 'prefix',
          )?.configValue || '',
        urlPath:
          aiService.aiServiceConfigs.find(
            (config) => config.configKey === 'path',
          )?.configValue || '',
      };

      if (!diagnosis.fileId) {
        throw new RpcException({
          code: 404,
          message: '无上传文件记录',
        });
      }

      // 获取文件
      const fileMeta = await this.getFileMeta(diagnosis.fileId);
      const fileData = await this.downloadFile(fileMeta);

      // 调用诊断服务
      const result = await this.diagnosisHttpService.diagnose(
        fileData,
        fileMeta.originalFileName,
        config,
        token,
      );

      // 更新诊断状态
      diagnosis.status = Status.COMPLETED;
      diagnosis.diagnosisResult = result;
      await queryRunner.manager.save(diagnosis);
      await queryRunner.commitTransaction();

      return formatResponse(200, result, '诊断成功');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new RpcException({
        code: 500,
        message: '开始诊断失败',
        data: error,
      });
    } finally {
      await queryRunner.release();
    }
  }

  private async getFileMeta(fileId: number): Promise<FileEntity> {
    const { success, result: file } = await lastValueFrom(
      this.fileClient.send(
        { cmd: FILE_MESSAGE_PATTERNS.GET_FILE_BY_ID },
        { fileId },
      ),
    );

    if (!success || !file) {
      throw new RpcException({
        code: 500,
        message: '获取文件失败',
      });
    }

    return file;
  }

  private async downloadFile(file: FileEntity): Promise<Buffer> {
    const { success, data } = await lastValueFrom(
      this.downloadClient.send(
        { cmd: DOWNLOAD_MESSAGE_PATTERNS.FILE_DOWNLOAD },
        { fileMeta: file },
      ),
    );

    if (!success) {
      throw new RpcException({
        code: 500,
        message: '获取文件失败',
      });
    }

    return Buffer.from(data, 'base64');
  }

  // 获取诊断服务状态
  async getDiagnosisStatus(id: number) {
    const diagnosis = await this.diagnosisRepository.findOne({
      where: { id },
    });
    if (!diagnosis) {
      throw new RpcException('未找到诊断记录');
    }
    return formatResponse(200, diagnosis, '获取诊断状态成功');
  }

  async diagnosisHistoryGet(userId: number) {
    const diagnosisHistory = await this.diagnosisRepository.find({
      where: { createdBy: userId },
      order: { createdAt: 'DESC' },
    });
    return formatResponse(200, diagnosisHistory, '获取诊断历史记录成功');
  }

  async diagnosisHistoryDelete(id: number, userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const diagnosis = await queryRunner.manager.findOne(DiagnosisHistory, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!diagnosis) {
        throw new RpcException('未找到诊断记录');
      }
      try {
        await firstValueFrom(
          this.fileClient.send<{ success: boolean }>(
            { cmd: FILE_MESSAGE_PATTERNS.DELETE_FILE },
            {
              fileId: diagnosis.fileId,
              userId,
            },
          ),
        );
      } catch (error) {
        this.logger.error(error);
      }
      await queryRunner.manager.remove(DiagnosisHistory, diagnosis);
      await queryRunner.commitTransaction();
      return formatResponse(204, null, '删除诊断记录成功');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new RpcException({
        code: 500,
        message: '删除诊断记录失败',
        data: error,
      });
    } finally {
      await queryRunner.release();
    }
  }

  async diagnosisHistoriesDelete(userId: number, diagnosisIds: number[]) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const diagnosisList = await queryRunner.manager.find(DiagnosisHistory, {
        where: { id: In(diagnosisIds), createdBy: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (diagnosisList.length !== diagnosisIds.length) {
        throw new RpcException('未找到诊断记录');
      }
      try {
        await firstValueFrom(
          this.fileClient.send<{ success: boolean }>(
            { cmd: FILE_MESSAGE_PATTERNS.DELETE_FILES },
            {
              fileIds: diagnosisList.map((diagnosis) => diagnosis.fileId),
              userId,
            },
          ),
        );
      } catch (error) {
        this.logger.error(error);
      }
      await queryRunner.manager.remove(DiagnosisHistory, diagnosisList);
      await queryRunner.commitTransaction();
      return formatResponse(204, null, '删除诊断记录成功');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new RpcException({
        code: 500,
        message: '删除诊断记录失败',
        data: error,
      });
    } finally {
      await queryRunner.release();
    }
  }

  async diagnosisSupportGet() {
    const aiServiceList = await this.aiServiceRepository.find({
      where: { status: 'active' },
    });
    return formatResponse(200, aiServiceList, '获取诊断支持成功');
  }

  // 获取诊断历史记录
  async diagnosisHistoryListGet(
    page: number = 1,
    pageSize: number = 10,
    userId: number,
  ) {
    const [list, total] = await this.diagnosisRepository.findAndCount({
      where: { createdBy: userId },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
    return formatResponse(
      200,
      { list, total, page, pageSize },
      '获取诊断历史记录成功',
    );
  }
}
