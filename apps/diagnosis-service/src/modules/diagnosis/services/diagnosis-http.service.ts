import { HttpService } from '@common/services/http.service';
import {
  CreateDiagnosisTaskResponse,
  DiagnosisConfig,
  DiagnosisTaskResponse,
  InterfaceCallConfig,
} from '@common/types/diagnosis';
import { Injectable, Logger } from '@nestjs/common';
import * as FormData from 'form-data';

@Injectable()
export class DiagnosisHttpService {
  private readonly logger = new Logger(DiagnosisHttpService.name);

  constructor(private readonly httpService: HttpService) {}

  private async retryWithDelay<T>(
    operation: () => Promise<T>,
    retryCount: number,
    retryDelay: number,
  ): Promise<T> {
    let lastError: Error | undefined;
    for (let i = 0; i < retryCount; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (i < retryCount - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }
    throw lastError || new Error('Retry failed');
  }

  private async pollWithTimeout<T>(
    operation: () => Promise<T>,
    interval: number,
    maxAttempts: number,
    timeout: number,
    condition: (result: T) => boolean,
  ): Promise<T> {
    const startTime = Date.now();
    let attempts = 0;

    while (attempts < maxAttempts) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Polling timeout');
      }

      const result = await operation();
      if (condition(result)) {
        return result;
      }

      attempts++;
      if (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }

    throw new Error('Max polling attempts reached');
  }

  async callInterface<T>(
    config: DiagnosisConfig,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    data?: any,
    token?: string,
  ): Promise<T> {
    const { baseUrl, urlPrefix, urlPath, interfaceConfig } = config;
    const url = `${baseUrl}${urlPrefix}${urlPath}${path}`;

    // 构建请求头
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // 如果是 FormData，添加相应的请求头
    if (data instanceof FormData) {
      Object.assign(headers, data.getHeaders());
    }

    // 构建请求函数
    const makeRequest = async () => {
      let response;
      switch (method) {
        case 'GET':
          response = await this.httpService.get<T>(url, { headers });
          break;
        case 'POST':
          response = await this.httpService.post<T>(url, data, { headers });
          break;
        case 'PUT':
          response = await this.httpService.put<T>(url, data, { headers });
          break;
        case 'DELETE':
          response = await this.httpService.delete<T>(url, { headers });
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
      return response.data;
    };

    // 根据配置类型执行不同的调用策略
    if (interfaceConfig.type === 'single') {
      if (interfaceConfig.retryCount && interfaceConfig.retryDelay) {
        return this.retryWithDelay(
          makeRequest,
          interfaceConfig.retryCount,
          interfaceConfig.retryDelay,
        );
      }
      return makeRequest();
    } else if (interfaceConfig.type === 'polling') {
      const {
        interval = 5000,
        maxAttempts = 10,
        timeout = 300000,
        retryCount = 3,
        retryDelay = 1000,
      } = interfaceConfig;

      return this.pollWithTimeout(
        async () => {
          if (retryCount && retryDelay) {
            return this.retryWithDelay(makeRequest, retryCount, retryDelay);
          }
          return makeRequest();
        },
        interval,
        maxAttempts,
        timeout,
        (result) => result.status !== 'pending',
      );
    }

    throw new Error('Invalid interface configuration type');
  }

  async uploadFile(
    file: Buffer,
    fileName: string,
    config: DiagnosisConfig,
    token: string,
  ): Promise<CreateDiagnosisTaskResponse> {
    const formData = new FormData();
    formData.append('image', file, {
      filename: fileName,
      contentType: 'application/octet-stream',
    });

    return this.callInterface<CreateDiagnosisTaskResponse>(
      config,
      'POST',
      '',
      formData,
      token,
    );
  }

  async getTaskStatus(
    taskId: string,
    config: DiagnosisConfig,
    token: string,
  ): Promise<DiagnosisTaskResponse> {
    return this.callInterface<DiagnosisTaskResponse>(
      config,
      'GET',
      `/${taskId}`,
      undefined,
      token,
    );
  }
}
