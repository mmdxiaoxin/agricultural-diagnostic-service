import { LogLevel } from '@app/database/entities';
import { HttpService } from '@common/services/http.service';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { DiagnosisLogService } from '../../diagnosis-log.service';

@Injectable()
export class RequestHandler {
  private readonly logger = new Logger(RequestHandler.name);
  private diagnosisId: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly logService: DiagnosisLogService,
  ) {}

  initialize(diagnosisId: number) {
    this.diagnosisId = diagnosisId;
  }

  /**
   * 发送HTTP请求
   */
  async sendRequest<T>(
    method: string,
    url: string,
    params: any,
    config: AxiosRequestConfig,
  ): Promise<T> {
    try {
      let response;
      switch (method) {
        case 'GET':
          response = await this.httpService.get<T>(url, { params, ...config });
          break;
        case 'POST':
          response = await this.httpService.post<T>(url, params, config);
          break;
        case 'PUT':
          response = await this.httpService.put<T>(url, params, config);
          break;
        case 'DELETE':
          response = await this.httpService.delete<T>(url, {
            params,
            ...config,
          });
          break;
        default:
          throw new Error(`不支持的HTTP方法: ${method}`);
      }

      this.log(
        LogLevel.INFO,
        `接口响应状态: ${response.message || 'unknown'} || ${response.code}`,
        {
          code: response.code,
          message: response.message,
        },
      );

      return response;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * 处理请求错误
   */
  private handleRequestError(error: any): void {
    if (error instanceof AxiosError) {
      this.log(LogLevel.ERROR, `接口请求失败: ${error.message}`, {
        error: {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        },
      });
    } else {
      this.log(LogLevel.ERROR, `接口请求失败: ${error.message}`, {
        error: {
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 3).join('\n'),
        },
      });
    }
  }

  /**
   * 记录日志
   */
  private async log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
  ) {
    switch (level) {
      case LogLevel.ERROR:
        this.logger.error(message);
        break;
      case LogLevel.WARN:
        this.logger.warn(message);
        break;
      case LogLevel.INFO:
        this.logger.log(message);
        break;
      case LogLevel.DEBUG:
        this.logger.debug(message);
        break;
    }
    await this.logService.addLog(this.diagnosisId, level, message, metadata);
  }
}
