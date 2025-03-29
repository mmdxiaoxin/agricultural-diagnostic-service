import { File } from '@app/database/entities';
import { BaseResponse, HttpService } from '@common/services/http.service';
import { DiagnosisConfig, InterfaceCallConfig } from '@common/types/diagnosis';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import * as FormData from 'form-data';

type PollingOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'greaterThan'
  | 'lessThan'
  | 'exists'
  | 'notExists';

interface PollingCondition {
  field: string;
  operator: PollingOperator;
  value?: any;
}

type ProcessedParams = Record<string, any> | FormData;

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

  private checkPollingCondition<T extends Record<string, any>>(
    result: T,
    condition?: PollingCondition,
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

  private async pollWithTimeout<T extends Record<string, any>>(
    operation: () => Promise<T>,
    interval: number,
    maxAttempts: number,
    timeout: number,
    condition?: PollingCondition,
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
    path: string,
    fileMeta?: File,
    fileData?: Buffer,
  ): ProcessedParams {
    const processedParams = { ...params };
    const formData = new FormData();
    const urlParams = new Set<string>();

    // 从 URL 中提取参数名
    const urlParamRegex = /\{(\w+)\}/g;
    let match;
    while ((match = urlParamRegex.exec(path)) !== null) {
      urlParams.add(match[1]);
    }

    // 处理所有参数中的引用
    for (const [key, paramValue] of Object.entries(processedParams)) {
      if (
        typeof paramValue === 'string' &&
        paramValue.startsWith('{{#') &&
        paramValue.endsWith('}}')
      ) {
        try {
          const reference = paramValue.slice(3, -2);
          const [interfaceId, ...path] = reference.split('.');
          const result = previousResults.get(Number(interfaceId));

          if (!result) {
            throw new HttpException(
              `未找到接口 ${interfaceId} 的结果，请确保上一步接口调用成功`,
              500,
            );
          }

          let refValue = result;
          if (path.length > 0) {
            for (const pathKey of path) {
              refValue = refValue?.[pathKey];
              if (refValue === undefined) {
                throw new HttpException(
                  `接口 ${interfaceId} 的结果中未找到路径 ${path.join('.')}`,
                  500,
                );
              }
            }
          }
          processedParams[key] = refValue;
        } catch (error) {
          this.logger.error(`处理参数 ${key} 时出错: ${error.message}`);
          throw error;
        }
      }
    }

    // 处理文件参数
    for (const [key, paramValue] of Object.entries(processedParams)) {
      if (key === 'file' && fileMeta && fileData) {
        formData.append(paramValue, fileData, {
          filename: fileMeta.originalFileName,
          contentType: fileMeta.fileType,
        });
        continue;
      }
    }

    // 如果有文件参数，返回FormData
    if (Object.keys(processedParams).some((key) => key === 'file')) {
      return formData;
    }

    // 返回处理后的参数，不删除 URL 参数
    return processedParams;
  }

  private processUrlTemplate(
    url: string,
    params: Record<string, any>,
    previousResults: Map<number, any>,
  ): string {
    if (!url) {
      this.logger.warn('URL模板为空');
      return '';
    }

    this.logger.debug(`开始处理URL模板: ${url}`);
    this.logger.debug(`可用参数: ${JSON.stringify(params)}`);
    this.logger.debug(
      `可用结果: ${JSON.stringify(Array.from(previousResults.entries()))}`,
    );

    // 从 URL 中提取参数名
    const urlParamRegex = /\{(\w+)\}/g;
    let match;
    const urlParams = new Set<string>();
    while ((match = urlParamRegex.exec(url)) !== null) {
      urlParams.add(match[1]);
    }

    // 处理 URL 参数
    const urlParamsMap = new Map<string, any>();
    for (const key of urlParams) {
      const value = params[key];
      if (!value) {
        this.logger.warn(`URL模板参数 ${key} 未找到对应的值`);
        continue;
      }

      if (
        typeof value === 'string' &&
        value.startsWith('{{#') &&
        value.endsWith('}}')
      ) {
        try {
          const reference = value.slice(3, -2);
          const [interfaceId, ...path] = reference.split('.');
          const result = previousResults.get(Number(interfaceId));

          if (!result) {
            throw new HttpException(
              `未找到接口 ${interfaceId} 的结果，请确保上一步接口调用成功`,
              500,
            );
          }

          let refValue = result;
          if (path.length > 0) {
            for (const pathKey of path) {
              refValue = refValue?.[pathKey];
              if (refValue === undefined) {
                throw new HttpException(
                  `接口 ${interfaceId} 的结果中未找到路径 ${path.join('.')}`,
                  500,
                );
              }
            }
          }
          urlParamsMap.set(key, refValue);
        } catch (error) {
          this.logger.error(`处理URL参数 ${key} 时出错: ${error.message}`);
          throw error;
        }
      } else {
        urlParamsMap.set(key, value);
      }
    }

    // 替换 URL 中的参数
    let processedUrl = url;
    for (const [key, value] of urlParamsMap.entries()) {
      if (value !== undefined) {
        processedUrl = processedUrl.replace(`{${key}}`, value.toString());
      }
    }

    this.logger.debug(`处理后的URL: ${processedUrl}`);
    return processedUrl;
  }

  async callInterface<T extends Record<string, any>>(
    config: DiagnosisConfig,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    params: Record<string, any>,
    token: string,
    results: Map<number, any>,
    fileMeta?: File,
    fileData?: Buffer,
  ): Promise<BaseResponse<T>> {
    // 处理参数
    const processedParams = await this.processParams(
      params,
      results,
      path,
      fileMeta,
      fileData,
    );

    // 构建完整URL
    const fullUrl = `${config.baseUrl}${config.urlPrefix}${config.urlPath}${path}`;

    // 处理URL模板
    const processedUrl = this.processUrlTemplate(
      fullUrl,
      processedParams,
      results,
    );

    if (!processedUrl) {
      throw new HttpException('处理后的URL为空', 500);
    }

    this.logger.debug(`开始调用接口: ${method} ${processedUrl}`);
    this.logger.debug(`接口参数: ${JSON.stringify(processedParams)}`);

    // 构建请求配置
    const requestConfig = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type':
          processedParams instanceof FormData
            ? 'multipart/form-data'
            : 'application/json',
      },
    };

    // 发送请求的函数
    const sendRequest = async <T = any>() => {
      let response: BaseResponse<T>;
      try {
        switch (method.toUpperCase()) {
          case 'GET':
            response = await this.httpService.get<T>(processedUrl, {
              ...requestConfig,
              params: processedParams,
            });
            break;
          case 'POST':
            response = await this.httpService.post<T>(
              processedUrl,
              processedParams,
              requestConfig,
            );
            break;
          case 'PUT':
            response = await this.httpService.put<T>(
              processedUrl,
              processedParams,
              requestConfig,
            );
            break;
          case 'DELETE':
            response = await this.httpService.delete<T>(processedUrl, {
              ...requestConfig,
              params: processedParams,
            });
            break;
          default:
            throw new HttpException(`不支持的HTTP方法: ${method}`, 400);
        }

        if (!response || !response.data) {
          throw new HttpException('接口响应为空', 500);
        }

        this.logger.debug(`接口响应: ${JSON.stringify(response)}`);
        return response;
      } catch (error) {
        this.logger.error(`请求失败: ${error.message}`);
        throw error;
      }
    };

    // 获取当前请求的配置
    const currentRequest = config.requests[0];
    if (!currentRequest) {
      throw new HttpException('未找到请求配置', 500);
    }

    try {
      // 如果有重试配置，使用重试机制
      if (currentRequest.retryCount && currentRequest.retryCount > 0) {
        return await this.retryWithDelay(
          sendRequest<T>,
          currentRequest.retryCount,
          currentRequest.retryDelay || 1000,
        );
      }

      // 如果是轮询类型，使用轮询机制
      if (currentRequest.type === 'polling') {
        return await this.pollWithTimeout(
          sendRequest<T>,
          currentRequest.interval || 1000,
          currentRequest.maxAttempts || 10,
          currentRequest.timeout || 30000,
          currentRequest.pollingCondition,
        );
      }

      // 普通请求直接发送
      return await sendRequest<T>();
    } catch (error) {
      this.logger.error(`接口调用失败: ${error.message}`);
      throw error;
    }
  }
}
