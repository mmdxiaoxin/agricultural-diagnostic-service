import { FileEntity, HttpMethod } from '@app/database/entities';
import { Injectable } from '@nestjs/common';
import { HttpCallService } from './http-call.service';
import { InterfaceCallStrategy } from './type';
import { PollingCallStrategy } from './strategies/polling-call.strategy';
import { SingleCallStrategy } from './strategies/single-call.strategy';

@Injectable()
export class InterfaceCallStrategyFactory {
  constructor(private readonly httpCallService: HttpCallService) {}

  createStrategy(
    type: 'single' | 'polling',
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
    method: HttpMethod,
    path: string,
    params: any,
    token: string,
    fileMeta?: FileEntity,
    fileData?: Buffer,
    diagnosisId?: number,
    requestId?: number,
  ): InterfaceCallStrategy {
    // 找到对应的请求配置
    const requestConfig = config.requests.find(r => r.id === requestId);
    if (!requestConfig) {
      throw new Error(`未找到ID为 ${requestId} 的请求配置`);
    }

    switch (type) {
      case 'single':
        return new SingleCallStrategy(
          this.httpCallService,
          config,
          method,
          path,
          params,
          token,
          fileMeta,
          fileData,
          diagnosisId,
        );
      case 'polling':
        return new PollingCallStrategy(
          this.httpCallService,
          config,
          method,
          path,
          params,
          token,
          requestConfig.interval || 3000,
          requestConfig.maxAttempts || 20,
          requestConfig.timeout || 60000,
          requestConfig.pollingCondition,
          fileMeta,
          fileData,
          diagnosisId,
        );
      default:
        throw new Error(`不支持的接口调用类型: ${type}`);
    }
  }
} 