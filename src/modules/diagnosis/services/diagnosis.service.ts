import { Status } from '@/common/enum/status.enum';
import { FileManageService } from '@/modules/file/services/file-manage.service';
import { FileOperationService } from '@/modules/file/services/file-operation.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DiagnosisHistory } from '../models/diagnosis-history.entity';

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
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new error();
    } finally {
      await queryRunner.release();
    }
  }

  // 开始诊断数据
  async startDiagnosis(id: number): Promise<DiagnosisHistory> {
    const diagnosis = await this.diagnosisRepository.findOne({
      where: { id },
    });
    if (!diagnosis) {
      throw new Error('Diagnosis data not found');
    }

    diagnosis.status = Status.IN_PROGRESS;
    return await this.diagnosisRepository.save(diagnosis);
  }

  // 获取诊断服务状态
  async getDiagnosisStatus(id: number): Promise<DiagnosisHistory> {
    const diagnosis = await this.diagnosisRepository.findOne({
      where: { id },
    });
    if (!diagnosis) {
      throw new Error('Diagnosis data not found');
    }

    return diagnosis;
  }

  // 获取诊断历史记录
  async getDiagnosisHistory(userId: number): Promise<DiagnosisHistory[]> {
    return this.diagnosisRepository.find({ where: { createdBy: userId } });
  }
}
