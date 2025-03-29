import { File } from '@app/database/entities';
import { BaseResponse, HttpService } from '@common/services/http.service';
import { DiagnosisConfig } from '@common/types/diagnosis';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import * as FormData from 'form-data';
import {
  cloneDeep,
  endsWith,
  forEach,
  get,
  isEmpty,
  isString,
  omit,
  replace,
  set,
  some,
  startsWith,
  toString,
  isEqual,
  gt,
  isNil,
  isArray,
  includes,
  lt,
} from 'lodash-es';
import { DiagnosisLogService } from './diagnosis-log.service';
import { LogLevel } from '@app/database/entities/diagnosis-log.entity';

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

  private checkPollingCondition<T extends Record<string, any>>(
    result: T,
    condition?: PollingCondition,
  ): boolean {
    if (!condition) {
      return get(result, 'status') !== 'pending';
    }

    const { field, operator, value } = condition;

    try {
      // 获取嵌套值
      const fieldValue = get(result, field);
      if (fieldValue === undefined) {
        return false;
      }

      // 根据操作符进行比较
      switch (operator) {
        case 'equals':
          return isEqual(fieldValue, value);
        case 'notEquals':
          return !isEqual(fieldValue, value);
        case 'contains':
          return isArray(fieldValue)
            ? includes(fieldValue, value)
            : includes(toString(fieldValue), toString(value));
        case 'greaterThan':
          return gt(fieldValue, value);
        case 'lessThan':
          return lt(fieldValue, value);
        case 'exists':
          return !isNil(fieldValue);
        case 'notExists':
          return isNil(fieldValue);
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
    let lastResponse: T | null = null;

    while (attempts < maxAttempts) {
      if (gt(Date.now() - startTime, timeout)) {
        throw new HttpException('轮询超时', 408);
      }

      try {
        // 如果不是第一次请求，等待指定间隔
        if (lastResponse) {
          this.logger.debug(`等待 ${interval}ms 后进行下一次轮询`);
          await new Promise((resolve) => setTimeout(resolve, interval));
        }

        const result = await operation();
        lastResponse = result;

        // 检查响应状态
        const status = get(result, 'data.status');
        if (isEqual(status, 'processing')) {
          attempts++;
          if (attempts < maxAttempts) {
            this.logger.debug(`任务处理中，第 ${attempts} 次轮询`);
            continue;
          }
        }

        // 检查轮询条件
        if (this.checkPollingCondition(result, condition)) {
          return result;
        }

        attempts++;
        if (attempts >= maxAttempts) {
          this.logger.debug(`达到最大轮询次数: ${maxAttempts}`);
        }
      } catch (error: any) {
        // 处理 500 错误且状态为 processing 的情况
        if (
          error instanceof AxiosError &&
          isEqual(get(error, 'response.status'), 500) &&
          isEqual(get(error, 'response.data.status'), 'processing')
        ) {
          attempts++;
          if (attempts < maxAttempts) {
            this.logger.debug(`任务处理中，第 ${attempts} 次轮询`);
            continue;
          }
        }

        // 其他错误直接抛出
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
    // 深拷贝
    const processedParams = cloneDeep(params);
    const formData = new FormData();

    // 处理嵌套对象
    const urlParams = new Set<string>();
    const urlParamRegex = /\{(\w+)\}/g;
    let match: RegExpExecArray | null;
    while ((match = urlParamRegex.exec(path)) !== null) {
      urlParams.add(match[1]);
    }

    // 处理参数引用
    forEach(processedParams, (paramValue, key) => {
      if (
        isString(paramValue) &&
        startsWith(paramValue, '{{#') &&
        endsWith(paramValue, '}}')
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

          // 获取嵌套值
          const refValue =
            path.length > 0 ? get(result, path.join('.')) : result;
          if (refValue === undefined) {
            throw new HttpException(
              `接口 ${interfaceId} 的结果中未找到路径 ${path.join('.')}`,
              500,
            );
          }
          set(processedParams, key, refValue);
        } catch (error) {
          this.logger.error(`处理参数 ${key} 时出错: ${error.message}`);
          throw error;
        }
      }
    });

    // 处理文件参数
    forEach(processedParams, (paramValue, key) => {
      if (key === 'file' && fileMeta && fileData) {
        formData.append(paramValue, fileData, {
          filename: fileMeta.originalFileName,
          contentType: fileMeta.fileType,
        });
      }
    });

    // 检查文件参数
    if (some(Object.keys(processedParams), (key) => key === 'file')) {
      return formData;
    }

    // 移除 URL 参数
    return omit(processedParams, Array.from(urlParams));
  }

  private processUrlTemplate(
    url: string,
    params: Record<string, any>,
    previousResults: Map<number, any>,
  ): string {
    if (isEmpty(url)) {
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

      if (isString(value) && startsWith(value, '{{#') && value.endsWith('}}')) {
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

          const refValue =
            path.length > 0 ? get(result, path.join('.')) : result;
          if (refValue === undefined) {
            throw new HttpException(
              `接口 ${interfaceId} 的结果中未找到路径 ${path.join('.')}`,
              500,
            );
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
        processedUrl = replace(processedUrl, `{${key}}`, toString(value));
      }
    }

    this.logger.debug(`处理后的URL: ${processedUrl}`);
    return processedUrl;
  }

  private async log(
    diagnosisId: number,
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
  ) {
    // 控制台日志立即输出
    this.logger[level](message);

    // 数据库日志异步写入
    await this.logService.addLog(diagnosisId, level, message, metadata);
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
    diagnosisId?: number,
  ): Promise<BaseResponse<T>> {
    // 构建完整URL
    const fullUrl = `${config.baseUrl}${config.urlPrefix}${config.urlPath}${path}`;

    // 先处理URL模板
    const processedUrl = this.processUrlTemplate(fullUrl, params, results);

    if (!processedUrl) {
      throw new HttpException('处理后的URL为空', 500);
    }

    // 处理参数（移除已用于URL的参数）
    const processedParams = this.processParams(
      params,
      results,
      path,
      fileMeta,
      fileData,
    );

    // 使用 Promise.all 并行处理日志
    await Promise.all([
      this.log(
        diagnosisId!,
        LogLevel.DEBUG,
        `开始调用接口: ${method} ${processedUrl}`,
        { method, url: processedUrl },
      ),
      processedParams instanceof FormData
        ? fileMeta
          ? this.log(
              diagnosisId!,
              LogLevel.DEBUG,
              `接口参数: {${params?.file || 'file'}: ${fileMeta.originalFileName}}`,
              {
                method,
                url: processedUrl,
                file: {
                  name: fileMeta.originalFileName,
                  type: fileMeta.fileType,
                },
              },
            )
          : this.log(diagnosisId!, LogLevel.DEBUG, '接口参数: {}', {
              method,
              url: processedUrl,
            })
        : this.log(
            diagnosisId!,
            LogLevel.DEBUG,
            `接口参数: ${JSON.stringify(processedParams)}`,
            { method, url: processedUrl },
          ),
    ]);

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
          currentRequest.interval || 3000, // 增加默认轮询间隔
          currentRequest.maxAttempts || 20, // 增加默认最大尝试次数
          currentRequest.timeout || 60000, // 增加默认超时时间
          currentRequest.pollingCondition,
        );
      }

      // 普通请求直接发送
      return await sendRequest<T>();
    } catch (error) {
      await this.log(
        diagnosisId!,
        LogLevel.ERROR,
        `接口调用失败: ${error.message}`,
        {
          method,
          url: processedUrl,
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
