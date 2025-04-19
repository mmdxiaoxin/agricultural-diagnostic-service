import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@common/services/http.service';
import { BaseResponse } from '@common/services/http.service';
import { DiagnosisLogService } from '../diagnosis-log.service';
import { LogLevel } from '@app/database/entities/diagnosis-log.entity';
import { HttpException } from '@nestjs/common';
import { AxiosError } from 'axios';

@Injectable()
export class HttpCallService {
  private readonly logger = new Logger(HttpCallService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly logService: DiagnosisLogService,
  ) {}

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

  private async pollWithTimeout<T extends Record<string, any>>(
    operation: () => Promise<T>,
    interval: number,
    maxAttempts: number,
    timeout: number,
    condition?: {
      field: string;
      operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'exists' | 'notExists';
      value?: any;
    },
    diagnosisId?: number,
  ): Promise<T> {
    const startTime = Date.now();
    let attempts = 0;
    let lastResponse: T | null = null;

    while (attempts < maxAttempts) {
      if (Date.now() - startTime > timeout) {
        throw new HttpException('轮询超时', 408);
      }

      try {
        if (lastResponse) {
          await this.log(
            diagnosisId!,
            LogLevel.DEBUG,
            `等待 ${interval}ms 后进行下一次轮询`,
          );
          await new Promise((resolve) => setTimeout(resolve, interval));
        }

        const result = await operation();
        lastResponse = result;

        if (this.checkPollingCondition(result, condition)) {
          return result;
        }

        attempts++;
        if (attempts >= maxAttempts) {
          await this.log(
            diagnosisId!,
            LogLevel.DEBUG,
            `达到最大轮询次数: ${maxAttempts}`,
          );
        }
      } catch (error: any) {
        if (attempts === 0 && error instanceof AxiosError) {
          const status = error.response?.status;
          const data = error.response?.data;

          if (
            status === 500 &&
            (data?.message?.includes('未知任务状态') ||
              data?.message?.includes('STARTED'))
          ) {
            attempts++;
            await this.log(
              diagnosisId!,
              LogLevel.DEBUG,
              '第一次请求任务状态未就绪，继续等待',
            );
            continue;
          }
        }

        await this.log(
          diagnosisId!,
          LogLevel.ERROR,
          `轮询过程中出错: ${error.message}`,
          {
            error: {
              message: error.message,
              stack: error.stack,
            },
          },
        );
        throw error;
      }
    }

    throw new HttpException('达到最大轮询次数', 408);
  }

  private checkPollingCondition<T extends Record<string, any>>(
    result: T,
    condition?: {
      field: string;
      operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'exists' | 'notExists';
      value?: any;
    },
  ): boolean {
    if (!condition) {
      return result.status !== 'pending';
    }

    const { field, operator, value } = condition;
    const fieldValue = this.getNestedValue(result, field);

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'notEquals':
        return fieldValue !== value;
      case 'contains':
        return Array.isArray(fieldValue)
          ? fieldValue.includes(value)
          : String(fieldValue).includes(String(value));
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

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async log(
    diagnosisId: number,
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
  ) {
    this.logger[level](message);

    const MAX_MESSAGE_LENGTH = 1000;
    const truncatedMessage =
      message.length > MAX_MESSAGE_LENGTH
        ? `${message.substring(0, MAX_MESSAGE_LENGTH)}...`
        : message;

    let processedMetadata = metadata;
    if (metadata) {
      processedMetadata = this.truncateMetadata(metadata);
    }

    await this.logService.addLog(
      diagnosisId,
      level,
      truncatedMessage,
      processedMetadata,
    );
  }

  private truncateMetadata(metadata: Record<string, any>): Record<string, any> {
    const MAX_STRING_LENGTH = 500;
    const processed: Record<string, any> = {};

    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
        processed[key] = `${value.substring(0, MAX_STRING_LENGTH)}...`;
      } else if (typeof value === 'object' && value !== null) {
        processed[key] = this.truncateMetadata(value);
      } else {
        processed[key] = value;
      }
    }

    return processed;
  }

  async call<T extends Record<string, any>>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    params: any,
    headers: Record<string, string>,
    retryCount?: number,
    retryDelay?: number,
    pollingConfig?: {
      interval: number;
      maxAttempts: number;
      timeout: number;
      condition?: {
        field: string;
        operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'exists' | 'notExists';
        value?: any;
      };
    },
    diagnosisId?: number,
  ): Promise<BaseResponse<T>> {
    const requestConfig = {
      headers,
    };

    const sendRequest = async <T = any>() => {
      let response: BaseResponse<T>;
      try {
        switch (method.toUpperCase()) {
          case 'GET':
            response = await this.httpService.get<T>(url, {
              ...requestConfig,
              params,
            });
            break;
          case 'POST':
            response = await this.httpService.post<T>(
              url,
              params,
              requestConfig,
            );
            break;
          case 'PUT':
            response = await this.httpService.put<T>(
              url,
              params,
              requestConfig,
            );
            break;
          case 'DELETE':
            response = await this.httpService.delete<T>(url, {
              ...requestConfig,
              params,
            });
            break;
          default:
            throw new HttpException(`不支持的HTTP方法: ${method}`, 400);
        }

        if (!response || !response.data) {
          throw new HttpException('接口响应为空', 500);
        }

        await this.log(
          diagnosisId!,
          LogLevel.DEBUG,
          `接口响应状态: ${response.message || 'unknown'}`,
          {
            code: response.code,
            message: response.message,
          },
        );
        return response;
      } catch (error) {
        await this.log(
          diagnosisId!,
          LogLevel.ERROR,
          `请求失败: ${error.message}`,
          {
            error: {
              message: error.message,
              stack: error.stack?.split('\n').slice(0, 3).join('\n'),
            },
          },
        );
        throw error;
      }
    };

    try {
      if (retryCount && retryCount > 0) {
        return await this.retryWithDelay(
          sendRequest<T>,
          retryCount,
          retryDelay || 1000,
        );
      }

      if (pollingConfig) {
        return await this.pollWithTimeout(
          sendRequest<T>,
          pollingConfig.interval,
          pollingConfig.maxAttempts,
          pollingConfig.timeout,
          pollingConfig.condition,
          diagnosisId,
        );
      }

      return await sendRequest<T>();
    } catch (error) {
      await this.log(
        diagnosisId!,
        LogLevel.ERROR,
        `接口调用失败: ${error.message}`,
        {
          method,
          url,
          error: {
            message: error.message,
            stack: error.stack,
          },
        },
      );
      throw error;
    }
  }
} 