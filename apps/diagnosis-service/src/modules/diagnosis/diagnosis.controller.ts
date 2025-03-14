import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DiagnosisService } from './diagnosis.service';

@Controller()
export class DiagnosisController {
  constructor(private readonly diagnosisService: DiagnosisService) {}

  @MessagePattern({ cmd: 'diagnosis.create' })
  async uploadData(@Payload() data: { userId: number; fileId: number }) {
    return this.diagnosisService.createDiagnosis(data.userId, data.fileId);
  }

  @MessagePattern({ cmd: 'diagnosis.start' })
  async startDiagnosis(@Payload() data: { id: number; userId: number }) {
    return await this.diagnosisService.startDiagnosis(data.id, data.userId);
  }

  @MessagePattern({ cmd: 'diagnosis.status' })
  async getDiagnosisStatus(@Payload() data: { id: number }) {
    return await this.diagnosisService.getDiagnosisStatus(data.id);
  }

  @MessagePattern({ cmd: 'diagnosis.history' })
  async diagnosisHistoryGet(@Payload() data: { userId: number }) {
    return await this.diagnosisService.diagnosisHistoryGet(data.userId);
  }

  @MessagePattern({ cmd: 'diagnosis.support' })
  async diagnosisSupportGet() {
    return await this.diagnosisService.diagnosisSupportGet();
  }

  @MessagePattern({ cmd: 'diagnosis.history.list' })
  async diagnosisHistoryListGet(
    @Payload() data: { page?: number; pageSize?: number; userId: number },
  ) {
    return await this.diagnosisService.diagnosisHistoryListGet(
      data.page,
      data.pageSize,
      data.userId,
    );
  }
}
