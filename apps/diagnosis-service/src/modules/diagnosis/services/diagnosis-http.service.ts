import { Injectable } from '@nestjs/common';
import { HttpService } from '@common/services/http.service';
import { DiagnosisConfig, DiagnosisResponse } from '@common/types/diagnosis';

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
    const fileBlob = new Blob([file]);
    formData.append('image', fileBlob, fileName);

    const response = await this.httpService.post<DiagnosisResponse>(
      url,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  }
}
