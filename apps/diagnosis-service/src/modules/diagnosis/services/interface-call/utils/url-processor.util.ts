import { LogLevel } from '@app/database/entities';
import { Injectable, Logger } from '@nestjs/common';
import {
  get,
  isEmpty,
  isString,
  replace,
  startsWith,
  toString,
} from 'lodash-es';
import { DiagnosisLogService } from '../../diagnosis-log.service';

@Injectable()
export class UrlProcessorUtil {
  private diagnosisId: number;

  constructor(private readonly logService: DiagnosisLogService) {}

  initialize(diagnosisId: number) {
    this.diagnosisId = diagnosisId;
  }

  /**
   * 处理URL模板
   * @param url URL模板
   * @param params 参数
   * @param previousResults 之前的接口调用结果
   * @returns 处理后的URL
   */
  processUrlTemplate(
    url: string,
    params: Record<string, any>,
    previousResults: Map<number, any>,
  ): string {
    if (isEmpty(url)) {
      this.log(LogLevel.WARN, 'URL模板为空');
      return '';
    }

    this.log(LogLevel.DEBUG, `开始处理URL模板: ${url}`);
    this.log(LogLevel.DEBUG, `可用参数: ${JSON.stringify(params)}`);
    this.log(
      LogLevel.DEBUG,
      `可用结果: ${JSON.stringify(Array.from(previousResults.entries()))}`,
    );

    const urlParamsMap = this.extractUrlParams(url, params, previousResults);
    return this.replaceUrlParams(url, urlParamsMap);
  }

  /**
   * 提取URL参数
   */
  private extractUrlParams(
    url: string,
    params: Record<string, any>,
    previousResults: Map<number, any>,
  ): Map<string, any> {
    const urlParamRegex = /\{(\w+)\}/g;
    const urlParamsMap = new Map<string, any>();
    let match;

    while ((match = urlParamRegex.exec(url)) !== null) {
      const key = match[1];
      const value = this.resolveParamValue(key, params, previousResults);
      if (value !== undefined) {
        urlParamsMap.set(key, value);
      }
    }

    return urlParamsMap;
  }

  /**
   * 解析参数值
   */
  private resolveParamValue(
    key: string,
    params: Record<string, any>,
    previousResults: Map<number, any>,
  ): any {
    const value = params[key];
    if (!value) {
      this.log(LogLevel.WARN, `URL模板参数 ${key} 未找到对应的值`);
      return undefined;
    }

    if (isString(value) && startsWith(value, '{{#') && value.endsWith('}}')) {
      return this.resolveReferenceValue(value, previousResults);
    }

    return value;
  }

  /**
   * 解析引用值
   */
  private resolveReferenceValue(
    value: string,
    previousResults: Map<number, any>,
  ): any {
    try {
      const reference = value.slice(3, -2);
      const [interfaceId, ...path] = reference.split('.');
      const result = previousResults.get(Number(interfaceId));

      if (!result) {
        throw new Error(
          `未找到接口 ${interfaceId} 的结果，请确保上一步接口调用成功`,
        );
      }

      const refValue = path.length > 0 ? get(result, path.join('.')) : result;
      if (refValue === undefined) {
        throw new Error(
          `接口 ${interfaceId} 的结果中未找到路径 ${path.join('.')}`,
        );
      }

      return refValue;
    } catch (error) {
      this.log(LogLevel.ERROR, `处理URL参数时出错: ${error.message}`);
      throw error;
    }
  }

  /**
   * 替换URL参数
   */
  private replaceUrlParams(url: string, paramsMap: Map<string, any>): string {
    let processedUrl = url;
    for (const [key, value] of paramsMap.entries()) {
      processedUrl = replace(processedUrl, `{${key}}`, toString(value));
    }

    this.log(LogLevel.DEBUG, `处理后的URL: ${processedUrl}`);
    return processedUrl;
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
