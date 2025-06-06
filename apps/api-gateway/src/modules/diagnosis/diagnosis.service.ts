import { FileEntity } from '@app/database/entities';
import { CreateFeedbackDto } from '@common/dto/diagnosis/create-feedback.dto';
import { CreateDiagnosisSupportDto } from '@common/dto/diagnosis/create-diagnosis-support.dto';
import { FeedbackQueryDto } from '@common/dto/diagnosis/feedback-query.dto';
import { StartDiagnosisDto } from '@common/dto/diagnosis/start-diagnosis.dto';
import { UpdateFeedbackDto } from '@common/dto/diagnosis/update-feedback.dto';
import { PageQueryDto } from '@common/dto/page-query.dto';
import { GrpcUploadService } from '@common/types/upload';
import {
  Inject,
  Injectable,
  OnModuleInit,
  InternalServerErrorException,
} from '@nestjs/common';
import { ClientGrpc, ClientProxy } from '@nestjs/microservices';
import { DIAGNOSIS_MESSAGE_PATTERNS } from '@shared/constants/diagnosis-message-patterns';
import {
  DIAGNOSIS_SERVICE_NAME,
  UPLOAD_SERVICE_NAME,
} from 'config/microservice.config';
import { Request } from 'express';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class DiagnosisService implements OnModuleInit {
  private uploadService: GrpcUploadService;

  constructor(
    @Inject(UPLOAD_SERVICE_NAME) private readonly uploadClient: ClientGrpc,
    @Inject(DIAGNOSIS_SERVICE_NAME)
    private readonly diagnosisClient: ClientProxy,
  ) {}

  onModuleInit() {
    this.uploadService =
      this.uploadClient.getService<GrpcUploadService>('UploadService');
  }

  async uploadData(req: Request, file: Express.Multer.File) {
    const fileRes = await lastValueFrom(
      this.uploadService.saveFile({
        fileMeta: {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        },
        fileData: file.buffer,
        userId: req.user.userId,
      }),
    );

    if (!fileRes?.data?.id) {
      throw new InternalServerErrorException('文件上传失败');
    }

    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.CREATE },
      {
        userId: req.user.userId,
        fileId: fileRes.data.id,
      },
    );
  }

  startDiagnosis(
    userId: number,
    diagnosisId: number,
    dto: StartDiagnosisDto,
    token: string,
  ) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.START },
      {
        diagnosisId,
        userId,
        dto,
        token,
      },
    );
  }

  startDiagnosisAsync(
    userId: number,
    diagnosisId: number,
    dto: StartDiagnosisDto,
    token: string,
  ) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.START_ASYNC },
      {
        diagnosisId,
        userId,
        dto,
        token,
      },
    );
  }

  getDiagnosisStatus(userId: number, id: number) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.STATUS },
      { userId, diagnosisId: id },
    );
  }

  getDiagnosisLog(id: number) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.LOG },
      { diagnosisId: id },
    );
  }

  getDiagnosisLogList(id: number, query: PageQueryDto) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.LOG_LIST },
      { diagnosisId: id, query },
    );
  }

  diagnosisHistoryGet(userId: number) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.HISTORY },
      { userId },
    );
  }

  diagnosisStatisticsGet(userId: number) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.STATISTICS },
      { userId },
    );
  }

  diagnosisSupportGet() {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.SUPPORT },
      {},
    );
  }

  diagnosisHistoryDelete(id: number, userId: number) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.HISTORY_DELETE },
      { id, userId },
    );
  }

  diagnosisHistoryFeedbackCreate(
    userId: number,
    id: number,
    dto: CreateFeedbackDto,
  ) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.FEEDBACK_CREATE },
      { userId, id, dto },
    );
  }

  diagnosisHistoriesDelete(userId: number, diagnosisIds: number[]) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.HISTORIES_DELETE },
      { diagnosisIds, userId },
    );
  }

  diagnosisHistoryListGet(userId: number, query: PageQueryDto) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.HISTORY_LIST },
      {
        query,
        userId,
      },
    );
  }

  diagnosisHistoryFeedbackDetailGet(userId: number, feedbackId: number) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.FEEDBACK_DETAIL },
      { userId, feedbackId },
    );
  }

  diagnosisHistoryFeedbackListGet(userId: number, query: FeedbackQueryDto) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.FEEDBACK_LIST },
      { userId, query },
    );
  }

  diagnosisHistoryFeedbackListAllGet(query: FeedbackQueryDto) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.FEEDBACK_LIST_ALL },
      { query },
    );
  }

  diagnosisHistoryFeedbackUpdate(
    expertId: number,
    feedbackId: number,
    dto: UpdateFeedbackDto,
  ) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.FEEDBACK_UPDATE },
      { expertId, id: feedbackId, dto },
    );
  }

  diagnosisHistoryFeedbackDelete(userId: number, feedbackId: number) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.FEEDBACK_DELETE },
      { userId, id: feedbackId },
    );
  }

  diagnosisHistoryFeedbackDeleteBatch(userId: number, feedbackIds: number[]) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.FEEDBACK_DELETE_BATCH },
      { userId, ids: feedbackIds },
    );
  }

  createDiagnosisSupport(data: CreateDiagnosisSupportDto) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.SUPPORT_CREATE },
      data,
    );
  }

  getDiagnosisSupportList() {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.SUPPORT_LIST },
      {},
    );
  }

  getDiagnosisSupport(id: number) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.SUPPORT_GET },
      { id },
    );
  }

  updateDiagnosisSupport(id: number, data: CreateDiagnosisSupportDto) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.SUPPORT_UPDATE },
      { id, ...data },
    );
  }

  deleteDiagnosisSupport(id: number) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.SUPPORT_DELETE },
      { id },
    );
  }
}
