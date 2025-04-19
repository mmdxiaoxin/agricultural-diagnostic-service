import { FileEntity, LogLevel } from "@app/database/entities";
import { HttpException, Injectable, Logger } from "@nestjs/common";
import * as FormData from 'form-data';
import { cloneDeep, endsWith, forEach, get, isArray, isEmpty, isString, omit, replace, set, some, startsWith, toString } from "lodash-es";
import { DiagnosisLogService } from "../diagnosis-log.service";

type ProcessedParams = Record<string, any> | FormData;

@Injectable()
export class InterfaceCallUtil {
  private readonly logger = new Logger(InterfaceCallUtil.name);

  // 诊断ID
  private diagnosisId: number;

  initialize(diagnosisId: number) {
    this.diagnosisId = diagnosisId;
  }

  constructor(
    private readonly logService: DiagnosisLogService,
  ) {}

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

  async log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
  ) {
    // 控制台日志立即输出
    this.logger[level](message);

    // 限制消息长度
    const MAX_MESSAGE_LENGTH = 1000;
    const truncatedMessage =
      message.length > MAX_MESSAGE_LENGTH
        ? `${message.substring(0, MAX_MESSAGE_LENGTH)}...`
        : message;

    // 限制元数据大小
    let processedMetadata = metadata;
    if (metadata) {
      processedMetadata = this.truncateMetadata(metadata);
    }

    // 数据库日志异步写入
    await this.logService.addLog(
      this.diagnosisId,
      level,
      truncatedMessage,
      processedMetadata,
    );
  }

  processParams(
    params: Record<string, any>,
    previousResults: Map<number, any>,
    path: string,
    fileMeta?: FileEntity,
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
          this.log(LogLevel.ERROR, `处理参数 ${key} 时出错: ${error.message}`);
          throw error;
        }
      }
    });

    // 处理文件参数和普通表单字段
    forEach(processedParams, (paramValue, key) => {
      if (key === 'file' && fileMeta && fileData) {
        formData.append(paramValue, fileData, {
          filename: fileMeta.originalFileName,
          contentType: fileMeta.fileType,
        });
      } else if (key !== 'file') {
        // 处理普通表单字段
        if (isArray(paramValue)) {
          // 如果是数组，需要分别添加每个元素
          paramValue.forEach((value, index) => {
            formData.append(`${key}[${index}]`, value);
          });
        } else if (typeof paramValue === 'object' && paramValue !== null) {
          // 如果是对象，需要递归处理
          Object.entries(paramValue).forEach(([subKey, value]) => {
            formData.append(`${key}[${subKey}]`, value);
          });
        } else {
          // 普通值直接添加
          formData.append(key, paramValue);
        }
      }
    });

    // 检查是否需要返回 FormData
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

    // 移除 URL 参数
    return omit(processedParams, Array.from(urlParams));
  }

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
    this.log(LogLevel.DEBUG,
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
        this.log(LogLevel.WARN, `URL模板参数 ${key} 未找到对应的值`);
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
          this.log(LogLevel.ERROR, `处理URL参数 ${key} 时出错: ${error.message}`);
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

    this.log(LogLevel.DEBUG, `处理后的URL: ${processedUrl}`);
    return processedUrl;
  }
}
