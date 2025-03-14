import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DIAGNOSIS_MESSAGE_PATTERNS } from '@shared/constants/diagnosis-message-patterns';
import { DiagnosisService } from './diagnosis.service';

@Controller()
export class DiagnosisController {
  constructor(private readonly diagnosisService: DiagnosisService) {}

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.CREATE })
  async uploadData(@Payload() data: { userId: number; fileId: number }) {
    return this.diagnosisService.createDiagnosis(data.userId, data.fileId);
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.START })
  async startDiagnosis(
    @Payload() data: { diagnosisId: number; userId: number },
  ) {
    return await this.diagnosisService.startDiagnosis(
      data.diagnosisId,
      data.userId,
    );
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.STATUS })
  async getDiagnosisStatus(@Payload() data: { diagnosisId: number }) {
    return await this.diagnosisService.getDiagnosisStatus(data.diagnosisId);
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.HISTORY })
  async diagnosisHistoryGet(@Payload() data: { userId: number }) {
    return await this.diagnosisService.diagnosisHistoryGet(data.userId);
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.SUPPORT })
  async diagnosisSupportGet() {
    return await this.diagnosisService.diagnosisSupportGet();
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.HISTORY_LIST })
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
