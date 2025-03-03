import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Status } from '@/common/enum/status.enum';
import { DiagnosisHistory } from '../models/diagnosis-history.entity';

@Injectable()
export class DiagnosisService {
  constructor(
    @InjectRepository(DiagnosisHistory)
    private diagnosisRepository: Repository<DiagnosisHistory>,
  ) {}

  // 上传待诊断数据
  async uploadData(userId: number, dto: any) {
    const diagnosisHistory = this.diagnosisRepository.create({
      ...dto,
      createdBy: userId,
      updatedBy: userId,
      status: Status.PENDING,
    });

    return await this.diagnosisRepository.save(diagnosisHistory);
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
