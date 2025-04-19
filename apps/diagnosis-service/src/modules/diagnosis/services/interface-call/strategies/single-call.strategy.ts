import { Injectable } from '@nestjs/common';
import { FileEntity, HttpMethod } from '@app/database/entities';
import { HttpCallService } from '../http-call.service';
import { InterfaceCallStrategy, InterfaceCallContext, InterfaceCallConfig } from '../type';

@Injectable()
export class SingleCallStrategy implements InterfaceCallStrategy {
  constructor(
    private readonly httpCallService: HttpCallService,
    private readonly config: InterfaceCallConfig,
    private readonly method: HttpMethod,
    private readonly path: string,
    private readonly params: any,
    private readonly token: string,
    private readonly fileMeta?: FileEntity,
    private readonly fileData?: Buffer,
    private readonly diagnosisId?: number,
  ) {}

  async execute(context: InterfaceCallContext): Promise<any> {
    try {
      const requestConfig = this.config.requests[0];
      if (!requestConfig) {
        throw new Error('未找到请求配置');
      }

      const headers = {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': this.fileData ? 'multipart/form-data' : 'application/json',
      };

      return await this.httpCallService.call(
        this.method,
        `${this.config.baseUrl}${this.config.urlPrefix}${this.path}`,
        this.params,
        headers,
        requestConfig.retryCount,
        requestConfig.retryDelay,
        undefined,
        this.diagnosisId,
      );
    } catch (error) {
      // 如果配置了重试次数，则进行重试
      if (this.config.requests[0].retryCount && context.retryCount < this.config.requests[0].retryCount) {
        context.retryCount++;
        context.state = 'retrying';
        
        // 等待重试延迟时间
        if (this.config.requests[0].retryDelay) {
          await new Promise(resolve => setTimeout(resolve, this.config.requests[0].retryDelay));
        }
        
        return this.execute(context);
      }
      
      throw error;
    }
  }
} 