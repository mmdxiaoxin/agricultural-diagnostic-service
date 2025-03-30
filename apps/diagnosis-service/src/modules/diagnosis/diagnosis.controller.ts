import { StartDiagnosisDto } from '@common/dto/diagnosis/start-diagnosis.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DIAGNOSIS_MESSAGE_PATTERNS } from '@shared/constants/diagnosis-message-patterns';
import { DiagnosisHistoryService } from './services/diagnosis-history.service';
import { DiagnosisService } from './services/diagnosis.service';

@Controller()
export class DiagnosisController {
  constructor(
    private readonly diagnosisService: DiagnosisService,
    private readonly diagnosisHistoryService: DiagnosisHistoryService,
  ) {}

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.CREATE })
  async diagnosisHistoryCreate(
    @Payload() data: { userId: number; fileId: number },
  ) {
    return this.diagnosisHistoryService.diagnosisHistoryCreate(
      data.userId,
      data.fileId,
    );
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.START })
  async startDiagnosis(
    @Payload()
    payload: {
      diagnosisId: number;
      userId: number;
      dto: StartDiagnosisDto;
      token: string;
    },
  ) {
    return this.diagnosisService.startDiagnosis(
      payload.diagnosisId,
      payload.userId,
      payload.dto,
      payload.token,
    );
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.START_ASYNC })
  async startDiagnosisAsync(
    @Payload()
    payload: {
      diagnosisId: number;
      userId: number;
      dto: StartDiagnosisDto;
      token: string;
    },
  ) {
    return this.diagnosisService.startDiagnosisAsync(
      payload.diagnosisId,
      payload.userId,
      payload.dto,
      payload.token,
    );
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.STATUS })
  async diagnosisHistoryStatusGet(@Payload() data: { diagnosisId: number }) {
    return this.diagnosisHistoryService.diagnosisHistoryStatusGet(
      data.diagnosisId,
    );
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.SUPPORT })
  async diagnosisSupportGet() {
    return this.diagnosisService.diagnosisSupportGet();
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.HISTORY })
  async diagnosisHistoryGet(@Payload() data: { userId: number }) {
    return this.diagnosisHistoryService.diagnosisHistoryGet(data.userId);
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.HISTORY_DELETE })
  async diagnosisHistoryDelete(@Payload() data: { id: number; userId }) {
    return this.diagnosisHistoryService.diagnosisHistoryDelete(
      data.id,
      data.userId,
    );
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.HISTORIES_DELETE })
  async diagnosisHistoriesDelete(
    @Payload() data: { userId: number; diagnosisIds: number[] },
  ) {
    return this.diagnosisHistoryService.diagnosisHistoriesDelete(
      data.userId,
      data.diagnosisIds,
    );
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.HISTORY_LIST })
  async diagnosisHistoryListGet(
    @Payload() data: { page?: number; pageSize?: number; userId: number },
  ) {
    return this.diagnosisHistoryService.diagnosisHistoryListGet(
      data.page,
      data.pageSize,
      data.userId,
    );
  }
}
