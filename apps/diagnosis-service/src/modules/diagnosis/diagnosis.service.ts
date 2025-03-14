import { DiagnosisHistory, File as FileEntity } from '@app/database/entities';
import { FileOperationService } from '@app/file-operation';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { DOWNLOAD_MESSAGE_PATTERNS } from '@shared/constants/download-message-patterns';
import { FILE_MESSAGE_PATTERNS } from '@shared/constants/file-message-patterns';
import { Status } from '@shared/enum/status.enum';
import { formatResponse } from '@shared/helpers/response.helper';
import axios from 'axios';
import {
  DOWNLOAD_SERVICE_NAME,
  FILE_SERVICE_NAME,
} from 'config/microservice.config';
import { lastValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class DiagnosisService {
  constructor(
    @InjectRepository(DiagnosisHistory)
    private readonly diagnosisRepository: Repository<DiagnosisHistory>,

    private readonly fileOperationService: FileOperationService,

    private readonly dataSource: DataSource,

    @Inject(FILE_SERVICE_NAME)
    private readonly fileClient: ClientProxy,

    @Inject(DOWNLOAD_SERVICE_NAME)
    private readonly downloadClient: ClientProxy,
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
      return { success: true, result: diagnosisHistory };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new error();
    } finally {
      await queryRunner.release();
    }
  }

  // 开始诊断数据
  async startDiagnosis(diagnosisId: number, userId: number) {
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
      const { success: fileGet, result: file } = await lastValueFrom(
        this.fileClient.send<{
          success: boolean;
          result: FileEntity;
        }>(
          {
            cmd: FILE_MESSAGE_PATTERNS.GET_FILE_BY_ID,
          },
          {
            fileId: diagnosis.fileId,
          },
        ),
      );
      if (!fileGet || !file) {
        throw new RpcException({
          code: 500,
          message: '获取文件失败',
        });
      }
      const { data, success } = await lastValueFrom(
        this.downloadClient.send<{
          success: boolean;
          data: string;
        }>(
          {
            cmd: DOWNLOAD_MESSAGE_PATTERNS.FILE_DOWNLOAD,
          },
          {
            fileMeta: file,
          },
        ),
      );
      if (!success)
        throw new RpcException({
          code: 500,
          message: '获取文件失败',
        });
      const fileStream = Buffer.from(data, 'base64');
      const fileBlob = new Blob([fileStream]);
      const formData = new FormData();
      formData.append('image', fileBlob, file.originalFileName);
      const response = await axios.post(
        'http://localhost:5001/yolo11/plant/classify',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      diagnosis.status = Status.COMPLETED;
      diagnosis.diagnosisResult = response.data;
      await queryRunner.manager.save(diagnosis);
      await queryRunner.commitTransaction();
      return { success: true, result: response.data };
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

  // 获取诊断服务状态
  async getDiagnosisStatus(id: number) {
    const diagnosis = await this.diagnosisRepository.findOne({
      where: { id },
    });
    if (!diagnosis) {
      throw new RpcException('未找到诊断记录');
    }
    return {
      success: true,
      result: diagnosis,
    };
  }

  async diagnosisHistoryGet(userId: number) {
    const diagnosisHistory = await this.diagnosisRepository.find({
      where: { createdBy: userId },
      order: { createdAt: 'DESC' },
      relations: ['file'],
    });
    return {
      success: true,
      result: diagnosisHistory,
    };
  }

  async diagnosisSupportGet() {
    return formatResponse(
      200,
      {
        plantId: 1,
        modelId: 1,
      },
      '获取诊断支持成功',
    );
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
    return {
      success: true,
      result: { list, total, page, pageSize },
    };
  }
}
