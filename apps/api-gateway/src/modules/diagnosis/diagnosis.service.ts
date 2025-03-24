import { File as FileEntity } from '@app/database/entities';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { DIAGNOSIS_MESSAGE_PATTERNS } from '@shared/constants/diagnosis-message-patterns';
import { formatResponse } from '@shared/helpers/response.helper';
import {
  DIAGNOSIS_SERVICE_NAME,
  UPLOAD_SERVICE_NAME,
} from 'config/microservice.config';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DiagnosisService {
  constructor(
    @Inject(UPLOAD_SERVICE_NAME) private readonly uploadClient: ClientProxy,
    @Inject(DIAGNOSIS_SERVICE_NAME)
    private readonly diagnosisClient: ClientProxy,
  ) {}

  async uploadData(req: Request, file: Express.Multer.File) {
    const fileRes = await firstValueFrom(
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

    await firstValueFrom(
      this.diagnosisClient.send(
        { cmd: DIAGNOSIS_MESSAGE_PATTERNS.CREATE },
        {
          userId: req.user.userId,
          fileId: fileRes.result.id,
        },
      ),
    );

    return formatResponse(200, null, '上传成功');
  }

  async startDiagnosis(req: Request, id: number) {
    const { success, result } = await firstValueFrom(
      this.diagnosisClient.send<{ success: boolean; result: any }>(
        { cmd: DIAGNOSIS_MESSAGE_PATTERNS.START },
        {
          diagnosisId: id,
          userId: req.user.userId,
        },
      ),
    );
    return success
      ? formatResponse(200, result, '开始诊断成功')
      : formatResponse(500, null, result);
  }

  async getDiagnosisStatus(id: number) {
    const { success, result } = await firstValueFrom(
      this.diagnosisClient.send<{ success: boolean; result: any }>(
        { cmd: DIAGNOSIS_MESSAGE_PATTERNS.STATUS },
        { diagnosisId: id },
      ),
    );
    return success
      ? formatResponse(200, result, '获取诊断状态成功')
      : formatResponse(500, null, result);
  }

  async diagnosisHistoryGet(req: Request) {
    const { success, result } = await firstValueFrom(
      this.diagnosisClient.send<{ success: boolean; result: any }>(
        { cmd: DIAGNOSIS_MESSAGE_PATTERNS.HISTORY },
        { userId: req.user.userId },
      ),
    );
    return success
      ? formatResponse(200, result, '获取诊断历史记录成功')
      : formatResponse(500, null, result);
  }

  async diagnosisSupportGet() {
    const { success, result } = await firstValueFrom(
      this.diagnosisClient.send<{ success: boolean; result: any }>(
        { cmd: DIAGNOSIS_MESSAGE_PATTERNS.SUPPORT },
        {},
      ),
    );
    return success
      ? formatResponse(200, result, '获取诊断支持成功')
      : formatResponse(500, null, result);
  }

  async diagnosisHistoryListGet(
    req: Request,
    page?: number,
    pageSize?: number,
  ) {
    const { success, result } = await firstValueFrom(
      this.diagnosisClient.send<{ success: boolean; result: any }>(
        { cmd: DIAGNOSIS_MESSAGE_PATTERNS.HISTORY_LIST },
        {
          page,
          pageSize,
          userId: req.user.userId,
        },
      ),
    );
    return success
      ? formatResponse(200, result, '获取诊断历史记录成功')
      : formatResponse(500, null, result);
  }
}
