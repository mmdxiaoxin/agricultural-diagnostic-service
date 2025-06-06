import { CreateFeedbackDto } from '@common/dto/diagnosis/create-feedback.dto';
import { FeedbackQueryDto } from '@common/dto/diagnosis/feedback-query.dto';
import { StartDiagnosisDto } from '@common/dto/diagnosis/start-diagnosis.dto';
import { UpdateFeedbackDto } from '@common/dto/diagnosis/update-feedback.dto';
import { PageQueryDto } from '@common/dto/page-query.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DIAGNOSIS_MESSAGE_PATTERNS } from '@shared/constants/diagnosis-message-patterns';
import { DiagnosisFeedbackService } from './services/diagnosis-feedback.service';
import { DiagnosisHistoryService } from './services/diagnosis-history.service';
import { DiagnosisLogService } from './services/diagnosis-log.service';
import { DiagnosisSupportService } from './services/diagnosis-support.service';
import { DiagnosisService } from './services/diagnosis.service';

@Controller()
export class DiagnosisController {
  constructor(
    private readonly diagnosisService: DiagnosisService,
    private readonly diagnosisHistoryService: DiagnosisHistoryService,
    private readonly diagnosisLogService: DiagnosisLogService,
    private readonly diagnosisFeedbackService: DiagnosisFeedbackService,
    private readonly diagnosisSupportService: DiagnosisSupportService,
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
  async diagnosisHistoryStatusGet(
    @Payload() data: { diagnosisId: number; userId: number },
  ) {
    return this.diagnosisHistoryService.diagnosisHistoryStatusGet(
      data.diagnosisId,
      data.userId,
    );
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.STATISTICS })
  async diagnosisStatisticsGet(@Payload() payload: { userId: number }) {
    return this.diagnosisService.diagnosisStatisticsGet(payload.userId);
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
    @Payload() data: { query: PageQueryDto; userId: number },
  ) {
    return this.diagnosisHistoryService.diagnosisHistoryListGet(
      data.query,
      data.userId,
    );
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.LOG_LIST })
  async diagnosisLogListGet(
    @Payload() payload: { diagnosisId: number; query: PageQueryDto },
  ) {
    return this.diagnosisLogService.findList(
      payload.diagnosisId,
      payload.query,
    );
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.LOG })
  async diagnosisLogGet(@Payload() payload: { diagnosisId: number }) {
    return this.diagnosisLogService.findAll(payload.diagnosisId);
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.FEEDBACK_LIST })
  async diagnosisFeedbackListGet(
    @Payload() payload: { userId: number; query: FeedbackQueryDto },
  ) {
    return this.diagnosisFeedbackService.getFeedbackList(
      payload.userId,
      payload.query,
    );
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.FEEDBACK_LIST_ALL })
  async diagnosisFeedbackListAllGet(
    @Payload() payload: { query: FeedbackQueryDto },
  ) {
    return this.diagnosisFeedbackService.getFeedbackListAll(payload.query);
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.FEEDBACK_DETAIL })
  async diagnosisFeedbackDetailGet(
    @Payload() payload: { feedbackId: number; userId: number },
  ) {
    return this.diagnosisFeedbackService.getFeedbackDetail(
      payload.feedbackId,
      payload.userId,
    );
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.FEEDBACK_CREATE })
  async diagnosisFeedbackCreate(
    @Payload() payload: { userId: number; id: number; dto: CreateFeedbackDto },
  ) {
    return this.diagnosisFeedbackService.createFeedback(
      payload.userId,
      payload.id,
      payload.dto,
    );
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.FEEDBACK_UPDATE })
  async diagnosisFeedbackUpdate(
    @Payload()
    payload: {
      id: number;
      expertId: number;
      dto: UpdateFeedbackDto;
    },
  ) {
    return this.diagnosisFeedbackService.updateFeedback(
      payload.id,
      payload.expertId,
      payload.dto,
    );
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.FEEDBACK_DELETE })
  async diagnosisFeedbackDelete(
    @Payload() payload: { userId: number; id: number },
  ) {
    return this.diagnosisFeedbackService.deleteFeedback(
      payload.userId,
      payload.id,
    );
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.FEEDBACK_DELETE_BATCH })
  async diagnosisFeedbackDeleteBatch(
    @Payload() payload: { userId: number; ids: number[] },
  ) {
    return this.diagnosisFeedbackService.deleteFeedbackBatch(
      payload.userId,
      payload.ids,
    );
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.SUPPORT_CREATE })
  async createDiagnosisSupport(
    @Payload()
    data: {
      key: string;
      value: { serviceId: number; configId: number };
      description: string;
    },
  ) {
    return this.diagnosisSupportService.create(
      data.key,
      data.value,
      data.description,
    );
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.SUPPORT_LIST })
  async getDiagnosisSupportList() {
    return this.diagnosisSupportService.findAll();
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.SUPPORT_GET })
  async getDiagnosisSupport(@Payload() data: { id: number }) {
    return this.diagnosisSupportService.findOne(data.id);
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.SUPPORT_UPDATE })
  async updateDiagnosisSupport(
    @Payload()
    data: {
      id: number;
      key: string;
      value: { serviceId: number; configId: number };
      description: string;
    },
  ) {
    return this.diagnosisSupportService.update(
      data.id,
      data.key,
      data.value,
      data.description,
    );
  }

  @MessagePattern({ cmd: DIAGNOSIS_MESSAGE_PATTERNS.SUPPORT_DELETE })
  async deleteDiagnosisSupport(@Payload() data: { id: number }) {
    return this.diagnosisSupportService.remove(data.id);
  }
}
