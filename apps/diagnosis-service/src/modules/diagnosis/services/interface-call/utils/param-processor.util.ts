import { FileEntity, LogLevel } from '@app/database/entities';
import { Injectable, Logger } from '@nestjs/common';
import * as FormData from 'form-data';
import {
  cloneDeep,
  forEach,
  get,
  isArray,
  isString,
  omit,
  set,
  some,
  startsWith,
} from 'lodash-es';
import { DiagnosisLogService } from '../../diagnosis-log.service';

type ProcessedParams = Record<string, any> | FormData;

@Injectable()
export class ParamProcessorUtil {
  private diagnosisId: number;

  constructor(private readonly logService: DiagnosisLogService) {}

  initialize(diagnosisId: number) {
    this.diagnosisId = diagnosisId;
  }

  /**
   * 处理请求参数
   */
  processParams(
    params: Record<string, any>,
    previousResults: Map<number, any>,
    url: string,
    fileMeta?: FileEntity,
    fileData?: Buffer,
  ): ProcessedParams {
    const processedParams = cloneDeep(params);
    const formData = new FormData();
    const urlParams = this.extractUrlParams(url);

    // 处理参数引用
    this.processParamReferences(processedParams, previousResults);

    // 处理文件参数和普通表单字段
    this.processFormData(processedParams, formData, fileMeta, fileData);

    // 检查是否需要返回 FormData
    if (this.shouldReturnFormData(processedParams)) {
      return formData;
    }

    // 移除 URL 参数
    return omit(processedParams, Array.from(urlParams));
  }

  /**
   * 提取URL参数
   */
  private extractUrlParams(path: string): Set<string> {
    const urlParams = new Set<string>();
    const urlParamRegex = /\{(\w+)\}/g;
    let match: RegExpExecArray | null;
    while ((match = urlParamRegex.exec(path)) !== null) {
      urlParams.add(match[1]);
    }
    return urlParams;
  }

  /**
   * 处理参数引用
   */
  private processParamReferences(
    processedParams: Record<string, any>,
    previousResults: Map<number, any>,
  ): void {
    forEach(processedParams, (paramValue, key) => {
      if (
        isString(paramValue) &&
        startsWith(paramValue, '{{#') &&
        paramValue.endsWith('}}')
      ) {
        try {
          const reference = paramValue.slice(3, -2);
          const [interfaceId, ...path] = reference.split('.');
          const result = previousResults.get(Number(interfaceId));

          if (!result) {
            throw new Error(
              `未找到接口 ${interfaceId} 的结果，请确保上一步接口调用成功`,
            );
          }

          const refValue =
            path.length > 0 ? get(result, path.join('.')) : result;
          if (refValue === undefined) {
            throw new Error(
              `接口 ${interfaceId} 的结果中未找到路径 ${path.join('.')}`,
            );
          }
          set(processedParams, key, refValue);
        } catch (error) {
          this.log(LogLevel.ERROR, `处理参数 ${key} 时出错: ${error.message}`);
          throw error;
        }
      }
    });
  }

  /**
   * 处理表单数据
   */
  private processFormData(
    processedParams: Record<string, any>,
    formData: FormData,
    fileMeta?: FileEntity,
    fileData?: Buffer,
  ): void {
    forEach(processedParams, (paramValue, key) => {
      if (key === 'file' && fileMeta && fileData) {
        formData.append(paramValue, fileData, {
          filename: fileMeta.originalFileName,
          contentType: fileMeta.fileType,
        });
      } else if (key !== 'file') {
        this.appendFormDataField(formData, key, paramValue);
      }
    });
  }

  /**
   * 添加表单字段
   */
  private appendFormDataField(
    formData: FormData,
    key: string,
    value: any,
  ): void {
    if (isArray(value)) {
      value.forEach((item, index) => {
        formData.append(`${key}[${index}]`, item);
      });
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([subKey, subValue]) => {
        formData.append(`${key}[${subKey}]`, subValue);
      });
    } else {
      formData.append(key, value);
    }
  }

  /**
   * 判断是否需要返回 FormData
   */
  private shouldReturnFormData(processedParams: Record<string, any>): boolean {
    return (
      some(Object.keys(processedParams), (key) => key === 'file') ||
      some(
        Object.values(processedParams),
        (value) =>
          value instanceof File ||
          value instanceof Blob ||
          value instanceof Buffer,
      )
    );
  }

  /**
   * 记录日志
   */
  private async log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
  ) {
    await this.logService.addLog(this.diagnosisId, level, message, metadata);
  }
}
