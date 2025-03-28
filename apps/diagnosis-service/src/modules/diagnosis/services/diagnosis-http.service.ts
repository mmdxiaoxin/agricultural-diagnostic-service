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

  private checkPollingCondition(
    result: any,
    condition: InterfaceCallConfig['pollingCondition'],
  ): boolean {
    if (!condition) {
      return result.status !== 'pending';
    }

    const { field, operator, value } = condition;

    // 获取要检查的值
    let fieldValue = result;
    for (const key of field.split('.')) {
      fieldValue = fieldValue?.[key];
      if (fieldValue === undefined) {
        return false;
      }
    }

    // 根据操作符进行比较
    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'notEquals':
        return fieldValue !== value;
      case 'contains':
        return Array.isArray(fieldValue)
          ? fieldValue.includes(value)
          : fieldValue.toString().includes(value);
      case 'greaterThan':
        return fieldValue > value;
      case 'lessThan':
        return fieldValue < value;
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'notExists':
        return fieldValue === undefined || fieldValue === null;
      default:
        return false;
    }
  }

  private async pollWithTimeout<T>(
    operation: () => Promise<T>,
    interval: number,
    maxAttempts: number,
    timeout: number,
    condition: InterfaceCallConfig['pollingCondition'],
  ): Promise<T> {
    const startTime = Date.now();
    let attempts = 0;

    while (attempts < maxAttempts) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Polling timeout');
      }

      const result = await operation();
      if (this.checkPollingCondition(result, condition)) {
        return result;
      }

      attempts++;
      if (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }

    throw new Error('Max polling attempts reached');
  }

  private processParams(
    params: Record<string, any>,
    previousResults: Map<number, any>,
  ): Record<string, any> {
    const processedParams = { ...params };

    for (const [key, value] of Object.entries(processedParams)) {
      if (
        typeof value === 'string' &&
        value.startsWith('{{#') &&
        value.endsWith('}}')
      ) {
        // 解析引用格式：{{#接口ID.response.data.xxx}}
        const reference = value.slice(3, -2);
        const [interfaceId, ...path] = reference.split('.');
        const result = previousResults.get(Number(interfaceId));

        if (result) {
          let value = result;
          for (const key of path) {
            value = value?.[key];
            if (value === undefined) break;
          }
          processedParams[key] = value;
        }
      }
    }

    return processedParams;
  }

  async callInterface<T>(
    config: DiagnosisConfig,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    data?: any,
    token?: string,
    previousResults?: Map<number, any>,
  ): Promise<T> {
    const { baseUrl, urlPrefix, urlPath, requests: interfaceConfig } = config;
    const url = `${baseUrl}${urlPrefix}${urlPath}${path}`;

    // 构建请求头
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // 处理参数引用
    let processedData = data;
    if (previousResults && typeof data === 'object') {
      processedData = this.processParams(data, previousResults);
    }

    // 如果是 FormData，添加相应的请求头
    if (processedData instanceof FormData) {
      Object.assign(headers, processedData.getHeaders());
    }

    // 构建请求函数
    const makeRequest = async () => {
      let response;
      switch (method) {
        case 'GET':
          response = await this.httpService.get<T>(url, {
            headers,
            params: processedData,
          });
          break;
        case 'POST':
          response = await this.httpService.post<T>(url, processedData, {
            headers,
          });
          break;
        case 'PUT':
          response = await this.httpService.put<T>(url, processedData, {
            headers,
          });
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
    if (!interfaceConfig.polling) {
      if (interfaceConfig.retryCount && interfaceConfig.retryDelay) {
        return this.retryWithDelay(
          makeRequest,
          interfaceConfig.retryCount,
          interfaceConfig.retryDelay,
        );
      }
      return makeRequest();
    } else {
      const {
        interval = 5000,
        maxAttempts = 10,
        timeout = 300000,
        retryCount = 3,
        retryDelay = 1000,
        pollingCondition,
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
        pollingCondition,
      );
    }
  }
}
