import {
  RemoteService,
  DiagnosisHistory,
  File as FileEntity,
} from '@app/database/entities';
import { StartDiagnosisDto } from '@common/dto/diagnosis/start-diagnosis.dto';
import {
  DiagnosisConfig,
  InterfaceCallConfig,
  CreateDiagnosisTaskResponse,
  DiagnosisTaskResponse,
} from '@common/types/diagnosis';
import { GrpcDownloadService } from '@common/types/download/download.types';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientGrpc, ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
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
  private downloadService: GrpcDownloadService;

  constructor(
    @Inject(FILE_SERVICE_NAME)
    private readonly fileClient: ClientProxy,
    @Inject(DOWNLOAD_SERVICE_NAME)
    private readonly downloadClient: ClientGrpc,
    @InjectRepository(DiagnosisHistory)
    private readonly diagnosisRepository: Repository<DiagnosisHistory>,
    @InjectRepository(RemoteService)
    private readonly remoteRepository: Repository<RemoteService>,
    private readonly dataSource: DataSource,
    private readonly diagnosisHttpService: DiagnosisHttpService,
  ) {}

  onModuleInit() {
    this.downloadService =
      this.downloadClient.getService<GrpcDownloadService>('DownloadService');
  }

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

  // 创建诊断任务并获取诊断结果
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
      // 1. 获取诊断记录
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

      // 2. 获取远程服务配置
      const remoteService = await this.remoteRepository.findOne({
        where: { id: dto.serviceId },
        relations: ['interfaces', 'configs'],
      });
      if (!remoteService) {
        throw new RpcException({
          code: 500,
          message: '未找到远程服务配置',
        });
      }

      // 3. 从服务配置中获取接口调用配置
      const remoteConfig = remoteService.configs.find(
        (config) => config.id === dto.configId,
      );
      if (!remoteConfig) {
        throw new RpcException({
          code: 500,
          message: '服务配置无接口配置',
        });
      }
      const requests = remoteConfig.config.requests;
      if (!requests || requests.length === 0) {
        throw new RpcException({
          code: 500,
          message: '服务配置中未指定接口调用配置',
        });
      }

      // 4. 按顺序获取接口配置
      const sortedRequests = requests.sort((a, b) => a.order - b.order);
      const remoteInterfaces = new Map(
        remoteService.interfaces.map((interf) => [interf.id, interf]),
      );

      // 5. 更新诊断状态
      diagnosis.status = Status.IN_PROGRESS;
      await queryRunner.manager.save(diagnosis);

      // 6. 获取文件
      if (!diagnosis.fileId) {
        throw new RpcException({
          code: 404,
          message: '无上传文件记录',
        });
      }
      const fileMeta = await this.getFileMeta(diagnosis.fileId);
      const fileData = await this.downloadFile(fileMeta);

      // 7. 按顺序调用接口
      const results = new Map<number, any>();
      let currentRequests = sortedRequests.filter(
        (config) => !config.next || config.next.length === 0,
      );

      while (currentRequests.length > 0) {
        // 并发调用当前层级的接口
        const promises = currentRequests.map(async (config) => {
          const remoteInterface = remoteInterfaces.get(config.id);
          if (!remoteInterface) {
            throw new RpcException({
              code: 500,
              message: `未找到ID为 ${config.id} 的接口配置`,
            });
          }

          const interfaceConfig = remoteInterface.config as Record<string, any>;
          const diagnosisConfig: DiagnosisConfig = {
            baseUrl: remoteInterface.url,
            urlPrefix: interfaceConfig.urlPrefix || '',
            urlPath: interfaceConfig.urlPath || '',
            requests: {
              type: config.callType,
              interval: config.interval,
              maxAttempts: config.maxAttempts,
              timeout: config.timeout,
              retryCount: config.retryCount,
              retryDelay: config.retryDelay,
              polling: config.callType === 'polling',
              pollingCondition: config.pollingCondition,
            },
          };

          const result = await this.diagnosisHttpService.callInterface(
            diagnosisConfig,
            interfaceConfig.method || 'POST',
            interfaceConfig.path || '',
            config.params || fileData,
            token,
            results,
          );

          results.set(config.id, result);
          return result;
        });

        await Promise.all(promises);

        // 获取下一层级的接口配置
        const nextInterfaceIds = new Set<number>();
        sortedRequests.forEach((config) => {
          if (config.next && config.next.length > 0) {
            const allPreviousCompleted = config.next.every((id) =>
              results.has(id),
            );
            if (allPreviousCompleted) {
              config.next.forEach((id) => nextInterfaceIds.add(id));
            }
          }
        });

        currentRequests = sortedRequests.filter(
          (config) =>
            nextInterfaceIds.has(config.id) && !results.has(config.id),
        );
      }

      // 8. 获取最后一个接口的结果
      const lastResult = results.get(
        sortedRequests[sortedRequests.length - 1].id,
      );
      if (!lastResult) {
        throw new RpcException({
          code: 500,
          message: '接口调用失败，未获取到结果',
        });
      }

      // 9. 更新诊断结果
      diagnosis.status = lastResult.status;
      diagnosis.diagnosisResult = lastResult;
      await queryRunner.manager.save(diagnosis);

      await queryRunner.commitTransaction();
      return formatResponse(200, lastResult, '已经开始诊断，请稍后查看结果');
    } catch (error) {
      this.logger.error(error);
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
    const { success, result: fileMeta } = await lastValueFrom(
      this.fileClient.send(
        { cmd: FILE_MESSAGE_PATTERNS.GET_FILE_BY_ID },
        { fileId },
      ),
    );

    if (!success || !fileMeta) {
      throw new RpcException({
        code: 500,
        message: '获取文件失败',
      });
    }

    return fileMeta;
  }

  private async downloadFile(fileMeta: FileEntity): Promise<Buffer> {
    const { success, data } = await lastValueFrom(
      this.downloadService.downloadFile({ fileMeta }),
    );

    if (!success) {
      throw new RpcException({
        code: 500,
        message: '获取文件失败',
      });
    }

    // 直接返回 Buffer 数据
    return Buffer.isBuffer(data) ? data : Buffer.from(data);
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
    const aiServiceList = await this.remoteRepository.find({
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
      order: { createdAt: 'DESC' },
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
