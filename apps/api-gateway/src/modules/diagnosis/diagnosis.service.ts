import { FileEntity } from '@app/database/entities';
import { StartDiagnosisDto } from '@common/dto/diagnosis/start-diagnosis.dto';
import { PageQueryDto } from '@common/dto/page-query.dto';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { DIAGNOSIS_MESSAGE_PATTERNS } from '@shared/constants/diagnosis-message-patterns';
import {
  DIAGNOSIS_SERVICE_NAME,
  UPLOAD_SERVICE_NAME,
} from 'config/microservice.config';
import { Request } from 'express';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class DiagnosisService {
  constructor(
    @Inject(UPLOAD_SERVICE_NAME) private readonly uploadClient: ClientProxy,
    @Inject(DIAGNOSIS_SERVICE_NAME)
    private readonly diagnosisClient: ClientProxy,
  ) {}

  async uploadData(req: Request, file: Express.Multer.File) {
    const fileRes = await lastValueFrom(
      this.uploadClient.send<{ success: boolean; result: FileEntity }>(
        { cmd: 'upload.single' },
        {
          fileMeta: {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          },
          fileData: file.buffer.toString('base64'),
          userId: req.user.userId,
        },
      ),
    );

    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.CREATE },
      {
        userId: req.user.userId,
        fileId: fileRes.result.id,
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

  getDiagnosisStatus(id: number) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.STATUS },
      { diagnosisId: id },
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
}
