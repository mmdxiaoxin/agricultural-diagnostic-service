import { File } from '@app/database/entities';
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
    fileMeta?: File,
    fileData?: Buffer,
  ): Record<string, any> {
    const processedParams = { ...params };
    const formData = new FormData();

    for (const [key, paramValue] of Object.entries(processedParams)) {
      // 处理文件参数
      if (key === 'file' && fileMeta && fileData) {
        formData.append(paramValue, fileData, {
          filename: fileMeta.originalFileName,
          contentType: fileMeta.fileType,
        });
        continue;
      }

      // 处理引用参数
      if (
        typeof paramValue === 'string' &&
        paramValue.startsWith('{{#') &&
        paramValue.endsWith('}}')
      ) {
        try {
          // 解析引用格式：{{#接口ID.response.data.xxx}} 或 {{#接口ID.xxx}}
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
          // 如果路径为空，直接使用结果
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

    // 如果有文件参数，返回FormData
    if (Object.keys(processedParams).some((key) => key === 'file')) {
      return formData;
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
        // 如果不是引用格式，直接使用参数值
        return value?.toString() || match;
      } catch (error) {
        this.logger.error(`处理URL模板参数 ${key} 时出错: ${error.message}`);
        return match;
      }
    });
  }

  async callInterface(
    config: DiagnosisConfig,
    method: string,
    path: string,
    params: any,
    token: string,
    results: Map<number, any>,
    fileMeta?: File,
    fileData?: Buffer,
  ): Promise<any> {
    // 处理参数
    const processedParams = await this.processParams(
      params,
      results,
      fileMeta,
      fileData,
    );

    // 处理URL模板
    const processedPath = this.processUrlTemplate(
      path,
      processedParams,
      results,
    );
    const fullUrl = `${config.baseUrl}${config.urlPrefix}${config.urlPath}${processedPath}`;
    this.logger.debug(`开始调用接口: ${method} ${fullUrl}`);
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

    // 发送请求
    let response;
    switch (method.toUpperCase()) {
      case 'GET':
        response = await this.httpService.get(fullUrl, {
          ...requestConfig,
          params: processedParams,
        });
        break;
      case 'POST':
        response = await this.httpService.post(
          fullUrl,
          processedParams,
          requestConfig,
        );
        break;
      case 'PUT':
        response = await this.httpService.put(
          fullUrl,
          processedParams,
          requestConfig,
        );
        break;
      case 'DELETE':
        response = await this.httpService.delete(fullUrl, {
          ...requestConfig,
          params: processedParams,
        });
        break;
      default:
        throw new HttpException(`不支持的HTTP方法: ${method}`, 400);
    }

    this.logger.debug(`接口响应: ${JSON.stringify(response.data)}`);

    // 处理响应
    const result = response.data;
    this.logger.debug(`处理后的结果: ${JSON.stringify(result)}`);

    return result;
  }
}
