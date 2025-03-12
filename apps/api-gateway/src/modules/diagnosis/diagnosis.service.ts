import { Status } from '@shared/enum/status.enum';
import { formatResponse } from '@shared/helpers/response.helper';
import { FileManageService } from '../file/services/file-manage.service';
import { FileOperationService } from '../file/services/file-operation.service';
import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DiagnosisHistory } from '../../../../../libs/database/src/entities/diagnosis-history.entity';
import axios from 'axios';
@Injectable()
export class DiagnosisService {
  constructor(
    @InjectRepository(DiagnosisHistory)
    private readonly diagnosisRepository: Repository<DiagnosisHistory>,
    private readonly fileManageService: FileManageService,
    private readonly fileOperationService: FileOperationService,
    private readonly dataSource: DataSource,
  ) {}

  // 上传待诊断数据
  async uploadData(userId: number, file: Express.Multer.File) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const diagnosisHistory = queryRunner.manager.create(DiagnosisHistory, {
        createdBy: userId,
        updatedBy: userId,
        status: Status.PENDING,
      });
      const fileMd5 = await this.fileOperationService.calculateFileMd5(
        file.path,
      );
      const fileEntity = await this.fileManageService.createFileInTransaction(
        userId,
        {
          originalFileName: file.originalname,
          storageFileName: file.filename,
          fileSize: file.size,
          fileType: file.mimetype,
          filePath: file.path,
          fileMd5,
        },
        queryRunner,
      );
      diagnosisHistory.file = fileEntity;
      await queryRunner.manager.save(diagnosisHistory);
      await queryRunner.commitTransaction();
      return formatResponse(200, null, '上传成功');
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
        throw new NotFoundException('未找到诊断记录');
      }
      if (diagnosis.createdBy !== userId) {
        throw new UnauthorizedException('无权操作');
      }
      diagnosis.status = Status.IN_PROGRESS;
      await queryRunner.manager.save(diagnosis);
      const file = diagnosis.file;
      if (!file) {
        throw new NotFoundException('未找到文件');
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
      return formatResponse(200, response.data, '诊断成功');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadGatewayException('诊断失败');
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
      throw new NotFoundException('未找到诊断记录');
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
