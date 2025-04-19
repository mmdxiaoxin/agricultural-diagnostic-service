import { FileEntity, HttpMethod } from '@app/database/entities';
import { Injectable } from '@nestjs/common';
import { DiagnosisHttpService } from '../../diagnosis-http.service';
import { InterfaceCallConfig, InterfaceCallContext, InterfaceCallStrategy } from '../interface-call.type';

@Injectable()
export class PollingCallStrategy implements InterfaceCallStrategy {
  constructor(
    private readonly diagnosisHttpService: DiagnosisHttpService,
    private readonly config: InterfaceCallConfig,
    private readonly method: HttpMethod,
    private readonly path: string,
    private readonly params: any,
    private readonly token: string,
    private readonly interval: number,
    private readonly maxAttempts: number,
    private readonly timeout: number,
    private readonly pollingCondition?: {
      field: string;
      operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'exists' | 'notExists';
      value?: any;
    },
    private readonly fileMeta?: FileEntity,
    private readonly fileData?: Buffer,
    private readonly diagnosisId?: number,
  ) {}

  async execute(context: InterfaceCallContext): Promise<any> {
    const startTime = Date.now();
    let attempts = 0;

    while (attempts < this.maxAttempts) {
      if (Date.now() - startTime > this.timeout) {
        throw new Error('轮询超时');
      }

      try {
        const result = await this.diagnosisHttpService.callInterface(
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

        // 检查轮询条件
        if (this.checkPollingCondition(result)) {
          return result;
        }

        attempts++;
        if (attempts < this.maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.interval));
        }
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

    throw new Error('达到最大轮询次数');
  }

  private checkPollingCondition(result: any): boolean {
    if (!this.pollingCondition) {
      return result.status !== 'pending';
    }

    const { field, operator, value } = this.pollingCondition;
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
} 