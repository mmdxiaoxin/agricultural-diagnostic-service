import { FileEntity } from '@app/database/entities';
import { LogLevel } from '@app/database/entities/diagnosis-log.entity';
import { Injectable, Logger } from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import * as FormData from 'form-data';
import {
  cloneDeep,
  endsWith,
  forEach,
  get,
  isArray,
  isEmpty,
  isString,
  omit,
  replace,
  set,
  some,
  startsWith,
  toString,
} from 'lodash-es';
import { DiagnosisLogService } from './diagnosis-log.service';
import { HttpCallService } from './interface-call/http-call.service';

type ProcessedParams = Record<string, any> | FormData;

@Injectable()
export class DiagnosisHttpService {
  private readonly logger = new Logger(DiagnosisHttpService.name);

  constructor(
    private readonly httpCallService: HttpCallService,
    private readonly logService: DiagnosisLogService,
  ) {}

  private processParams(
    params: Record<string, any>,
    previousResults: Map<number, any>,
    path: string,
    fileMeta?: FileEntity,
    fileData?: Buffer,
  ): ProcessedParams {
    const processedParams = cloneDeep(params);
    const formData = new FormData();

    const urlParams = new Set<string>();
    const urlParamRegex = /\{(\w+)\}/g;
    let match: RegExpExecArray | null;
    while ((match = urlParamRegex.exec(path)) !== null) {
      urlParams.add(match[1]);
    }

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

    forEach(processedParams, (paramValue, key) => {
      if (key === 'file' && fileMeta && fileData) {
        formData.append(paramValue, fileData, {
          filename: fileMeta.originalFileName,
          contentType: fileMeta.fileType,
        });
      } else if (key !== 'file') {
        if (isArray(paramValue)) {
          paramValue.forEach((value, index) => {
            formData.append(`${key}[${index}]`, value);
          });
        } else if (typeof paramValue === 'object' && paramValue !== null) {
          Object.entries(paramValue).forEach(([subKey, value]) => {
            formData.append(`${key}[${subKey}]`, value);
          });
        } else {
          formData.append(key, paramValue);
        }
      }
    });

    if (
      some(Object.keys(processedParams), (key) => key === 'file') ||
      some(
        Object.values(processedParams),
        (value) =>
          value instanceof FileEntity ||
          value instanceof Blob ||
          value instanceof Buffer,
      )
    ) {
      return formData;
    }

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

    const urlParamRegex = /\{(\w+)\}/g;
    let match;
    const urlParams = new Set<string>();
    while ((match = urlParamRegex.exec(url)) !== null) {
      urlParams.add(match[1]);
    }

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

  async callInterface<T extends Record<string, any>>(
    config: {
      baseUrl: string;
      urlPrefix: string;
      requests: Array<{
        id: number;
        order: number;
        type: 'single' | 'polling';
        interval?: number;
        maxAttempts?: number;
        timeout?: number;
        retryCount?: number;
        retryDelay?: number;
        delay?: number;
        next?: number[];
        params?: Record<string, any>;
        pollingCondition?: {
          field: string;
          operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'exists' | 'notExists';
          value?: any;
        };
      }>;
    },
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    params: Record<string, any>,
    token: string,
    results: Map<number, any>,
    fileMeta?: FileEntity,
    fileData?: Buffer,
    diagnosisId?: number,
  ) {
    const fullUrl = `${config.baseUrl}${config.urlPrefix}${path}`;
    const processedUrl = this.processUrlTemplate(fullUrl, params, results);

    if (!processedUrl) {
      throw new HttpException('处理后的URL为空', 500);
    }

    const processedParams = this.processParams(
      params,
      results,
      path,
      fileMeta,
      fileData,
    );

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

    const requestConfig = config.requests[0];
    if (!requestConfig) {
      throw new HttpException('未找到请求配置', 500);
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type':
        processedParams instanceof FormData
          ? 'multipart/form-data'
          : 'application/json',
    };

    return this.httpCallService.call<T>(
      method,
      processedUrl,
      processedParams,
      headers,
      requestConfig.retryCount,
      requestConfig.retryDelay,
      requestConfig.type === 'polling'
        ? {
            interval: requestConfig.interval || 3000,
            maxAttempts: requestConfig.maxAttempts || 20,
            timeout: requestConfig.timeout || 60000,
            condition: requestConfig.pollingCondition,
          }
        : undefined,
      diagnosisId,
    );
  }
}
