import { File as FileEntity } from '@app/database/entities';
import { StartDiagnosisDto } from '@common/dto/diagnosis/start-diagnosis.dto';
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

  startDiagnosis(userId: number, diagnosisId: number, dto: StartDiagnosisDto) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.START },
      {
        diagnosisId,
        userId,
        dto,
      },
    );
  }

  getDiagnosisStatus(id: number) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.STATUS },
      { diagnosisId: id },
    );
  }

  diagnosisHistoryGet(userId: number) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.HISTORY },
      { userId },
    );
  }

  diagnosisSupportGet() {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.SUPPORT },
      {},
    );
  }

  diagnosisHistoryListGet(userId: number, page?: number, pageSize?: number) {
    return this.diagnosisClient.send(
      { cmd: DIAGNOSIS_MESSAGE_PATTERNS.HISTORY_LIST },
      {
        page,
        pageSize,
        userId,
      },
    );
  }
}
