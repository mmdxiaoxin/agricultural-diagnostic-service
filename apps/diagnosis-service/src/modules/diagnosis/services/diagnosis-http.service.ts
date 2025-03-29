import { HttpService } from '@common/services/http.service';
import { DiagnosisConfig, InterfaceCallConfig } from '@common/types/diagnosis';
import { HttpException, Injectable, Logger } from '@nestjs/common';
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
        this.logger.warn(`重试第 ${i + 1} 次失败: ${error.message}`);
        if (i < retryCount - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }
    throw new HttpException(
      `重试 ${retryCount} 次后仍然失败: ${lastError?.message}`,
      500,
    );
  }

  private checkPollingCondition(
    result: any,
    condition: InterfaceCallConfig['pollingCondition'],
  ): boolean {
    if (!condition) {
      return result.status !== 'pending';
    }

    const { field, operator, value } = condition;

    try {
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
          this.logger.warn(`未知的操作符: ${operator}`);
          return false;
      }
    } catch (error) {
      this.logger.error(`检查轮询条件时出错: ${error.message}`);
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
        throw new HttpException('轮询超时', 408);
      }

      try {
        const result = await operation();
        if (this.checkPollingCondition(result, condition)) {
          return result;
        }

        attempts++;
        if (attempts < maxAttempts) {
          this.logger.debug(`轮询第 ${attempts} 次，等待 ${interval}ms`);
          await new Promise((resolve) => setTimeout(resolve, interval));
        }
      } catch (error) {
        this.logger.error(`轮询过程中出错: ${error.message}`);
        throw error;
      }
    }

    throw new HttpException('达到最大轮询次数', 408);
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
        try {
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
          } else {
            this.logger.warn(`未找到接口 ${interfaceId} 的结果`);
          }
        } catch (error) {
          this.logger.error(`处理参数 ${key} 时出错: ${error.message}`);
        }
      }
    }

    return processedParams;
  }

  private processUrlTemplate(
    url: string,
    params: Record<string, any>,
    previousResults: Map<number, any>,
  ): string {
    return url.replace(/\{(\w+)\}/g, (match, key) => {
      try {
        // 首先检查是否是引用格式
        const value = params[key];
        if (
          typeof value === 'string' &&
          value.startsWith('{{#') &&
          value.endsWith('}}')
        ) {
          const reference = value.slice(3, -2);
          const [interfaceId, ...path] = reference.split('.');
          const result = previousResults.get(Number(interfaceId));

          if (result) {
            let refValue = result;
            for (const pathKey of path) {
              refValue = refValue?.[pathKey];
              if (refValue === undefined) break;
            }
            return refValue?.toString() || match;
          }
        }
        return value?.toString() || match;
      } catch (error) {
        this.logger.error(`处理URL模板参数 ${key} 时出错: ${error.message}`);
        return match;
      }
    });
  }

  async callInterface<T>(
    config: DiagnosisConfig,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    data?: any,
    token?: string,
    previousResults?: Map<number, any>,
  ): Promise<T> {
    const { baseUrl, urlPrefix, urlPath, requests } = config;

    try {
      // 处理 URL 模板
      const processedPath = this.processUrlTemplate(
        path,
        data || {},
        previousResults || new Map(),
      );
      const url = `${baseUrl}${urlPrefix}${urlPath}${processedPath}`;

      // 构建请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
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
        try {
          let response;
          const requestConfig = {
            headers,
            timeout: requests[0].timeout,
            validateStatus: requests[0].validateStatus,
            ...(method === 'GET'
              ? { params: processedData }
              : { data: processedData }),
          };

          switch (method) {
            case 'GET':
              response = await this.httpService.get<T>(url, requestConfig);
              break;
            case 'POST':
              response = await this.httpService.post<T>(
                url,
                processedData,
                requestConfig,
              );
              break;
            case 'PUT':
              response = await this.httpService.put<T>(
                url,
                processedData,
                requestConfig,
              );
              break;
            case 'DELETE':
              response = await this.httpService.delete<T>(url, requestConfig);
              break;
            default:
              throw new HttpException(`不支持的HTTP方法: ${method}`, 400);
          }

          return response.data;
        } catch (error) {
          this.logger.error(`HTTP请求失败: ${error.message}`);
          throw new HttpException(
            `接口调用失败: ${error.message}`,
            error.response?.status || 500,
          );
        }
      };

      // 根据配置类型执行不同的调用策略
      const currentRequest = requests[0];
      if (currentRequest.type === 'single') {
        if (currentRequest.retryCount && currentRequest.retryDelay) {
          return this.retryWithDelay(
            makeRequest,
            currentRequest.retryCount,
            currentRequest.retryDelay,
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
        } = currentRequest;

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
    } catch (error) {
      this.logger.error(`接口调用失败: ${error.message}`);
      throw error;
    }
  }
}
