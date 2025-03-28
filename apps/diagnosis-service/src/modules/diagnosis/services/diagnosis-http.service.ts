import { HttpService } from '@common/services/http.service';
import {
  CreateDiagnosisTaskResponse,
  DiagnosisConfig,
  DiagnosisTaskResponse,
} from '@common/types/diagnosis';
import { Injectable, Logger } from '@nestjs/common';
import * as FormData from 'form-data';

@Injectable()
export class DiagnosisHttpService {
  private readonly logger = new Logger(DiagnosisHttpService.name);

  constructor(private readonly httpService: HttpService) {}

  async createDiagnosisTask(
    file: Buffer,
    fileName: string,
    config: DiagnosisConfig,
    token: string,
  ): Promise<CreateDiagnosisTaskResponse> {
    const { baseUrl, urlPrefix, urlPath } = config;
    const url = `${baseUrl}${urlPrefix}${urlPath}`;

    const formData = new FormData();
    formData.append('image', file, {
      filename: fileName,
      contentType: 'application/octet-stream',
    });

    const response = await this.httpService.post<CreateDiagnosisTaskResponse>(
      url,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  }

  async getDiagnosisTask(
    taskId: string,
    token: string,
    config: DiagnosisConfig,
  ): Promise<DiagnosisTaskResponse> {
    const { baseUrl, urlPrefix, urlPath } = config;
    const url = `${baseUrl}${urlPrefix}${urlPath}`;

    const response = await this.httpService.get<DiagnosisTaskResponse>(
      `${url}/${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  }
}
