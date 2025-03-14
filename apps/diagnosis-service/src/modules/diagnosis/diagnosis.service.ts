import { DiagnosisHistory, File as FileEntity } from '@app/database/entities';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Status } from '@shared/enum/status.enum';
import { formatResponse } from '@shared/helpers/response.helper';
import { FileOperationService } from 'apps/api-gateway/src/modules/file/services/file-operation.service';
import axios from 'axios';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class DiagnosisService {
  constructor(
    @InjectRepository(DiagnosisHistory)
    private readonly diagnosisRepository: Repository<DiagnosisHistory>,
    private readonly fileOperationService: FileOperationService,
    private readonly dataSource: DataSource,
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
      const file = await queryRunner.manager.findOne(FileEntity, {
        where: { id: fileId },
      });
      diagnosisHistory.file = file;
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
  async startDiagnosis(id: number, userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const diagnosis = await queryRunner.manager.findOne(DiagnosisHistory, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
        relations: ['file'],
      });
      if (!diagnosis) {
        throw new RpcException('未找到诊断记录');
      }
      if (diagnosis.createdBy !== userId) {
        throw new RpcException('无权操作');
      }
      diagnosis.status = Status.IN_PROGRESS;
      await queryRunner.manager.save(diagnosis);
      const file = diagnosis.file;
      if (!file) {
        throw new RpcException('未找到文件');
      }
      const fileStream = await this.fileOperationService.readFile(
        file.filePath,
      );
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
    return formatResponse(200, diagnosis, '开始诊断成功');
  }

  async diagnosisHistoryGet(userId: number) {
    const diagnosisHistory = await this.diagnosisRepository.find({
      where: { createdBy: userId },
      order: { createdAt: 'DESC' },
      relations: ['file'],
    });
    return formatResponse(200, diagnosisHistory, '获取诊断历史记录成功');
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
      relations: ['file'],
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
