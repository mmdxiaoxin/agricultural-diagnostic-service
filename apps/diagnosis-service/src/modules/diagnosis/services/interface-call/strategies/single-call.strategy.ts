import { Injectable } from '@nestjs/common';
import { FileEntity, HttpMethod } from '@app/database/entities';
import { DiagnosisHttpService } from '../../diagnosis-http.service';
import { InterfaceCallStrategy, InterfaceCallContext, InterfaceCallConfig } from '../interface-call.type';

@Injectable()
export class SingleCallStrategy implements InterfaceCallStrategy {
  constructor(
    private readonly diagnosisHttpService: DiagnosisHttpService,
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
      return await this.diagnosisHttpService.callInterface(
        this.config,
        this.method,
        this.path,
        this.params,
        this.token,
        new Map(),
        this.fileMeta,
        this.fileData,
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