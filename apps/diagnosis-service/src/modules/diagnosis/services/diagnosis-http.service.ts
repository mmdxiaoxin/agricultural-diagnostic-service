import { HttpService } from '@common/services/http.service';
import { DiagnosisConfig, DiagnosisResponse } from '@common/types/diagnosis';
import { Injectable } from '@nestjs/common';
import * as FormData from 'form-data';

@Injectable()
export class DiagnosisHttpService {
  constructor(private readonly httpService: HttpService) {}

  async diagnose(
    file: Buffer,
    fileName: string,
    config: DiagnosisConfig,
    token: string,
  ): Promise<DiagnosisResponse> {
    const { baseUrl, urlPrefix, urlPath } = config;
    const url = `${baseUrl}${urlPrefix}${urlPath}`;

    const formData = new FormData();
    formData.append('image', file, {
      filename: fileName,
      contentType: 'application/octet-stream',
    });

    const response = await this.httpService.post<DiagnosisResponse>(
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
}
