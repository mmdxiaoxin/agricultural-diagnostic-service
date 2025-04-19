import { HttpMethod } from '@app/database/entities';
import { FileEntity } from '@app/database/entities/file.entity';
import { Injectable } from '@nestjs/common';
import { DiagnosisLogService } from '../diagnosis-log.service';
import { InterfaceCallStrategyFactory } from './interface-call-strategy.factory';
import { InterfaceCallConfig, InterfaceCallContext } from './interface-call.type';

@Injectable()
export class InterfaceCallManager {
  private readonly contexts: Map<number, InterfaceCallContext> = new Map();
  private readonly dependencies: Map<number, Set<number>> = new Map();
  private readonly callbacks: Map<number, (context: InterfaceCallContext) => Promise<void>> = new Map();

  constructor(
    private readonly strategyFactory: InterfaceCallStrategyFactory,
    private readonly logService: DiagnosisLogService,
    private readonly requests: Array<{
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
    }>,
  ) {
    // 初始化上下文
    requests.forEach(request => {
      this.contexts.set(request.id, {
        id: request.id,
        state: 'pending',
        retryCount: 0,
        startTime: Date.now(),
      });

      // 建立依赖关系
      if (request.next && request.next.length > 0) {
        this.dependencies.set(request.id, new Set(request.next));
      }
    });
  }

  // 注册接口调用回调
  registerCallback(id: number, callback: (context: InterfaceCallContext) => Promise<void>) {
    this.callbacks.set(id, callback);
  }

  // 获取可执行的接口
  getExecutableInterfaces(): number[] {
    return Array.from(this.contexts.entries())
      .filter(([id, context]) => {
        // 只返回待执行的接口
        if (context.state !== 'pending') {
          return false;
        }

        // 检查依赖是否都已完成
        const deps = this.dependencies.get(id);
        if (!deps || deps.size === 0) {
          return true;
        }

        return Array.from(deps).every(depId => {
          const depContext = this.contexts.get(depId);
          return depContext?.state === 'success';
        });
      })
      .map(([id]) => id);
  }

  // 更新接口调用状态
  async updateState(id: number, state: 'pending' | 'processing' | 'success' | 'failed' | 'retrying', result?: any, error?: Error) {
    const context = this.contexts.get(id);
    if (!context) {
      throw new Error(`未找到接口 ${id} 的上下文`);
    }

    context.state = state;
    if (result) {
      context.result = result;
    }
    if (error) {
      context.error = error;
    }
    if (state === 'success' || state === 'failed') {
      context.endTime = Date.now();
    }

    // 执行回调
    const callback = this.callbacks.get(id);
    if (callback) {
      await callback(context);
    }
  }

  // 获取接口调用结果
  getResults(): Map<number, any> {
    const results = new Map<number, any>();
    this.contexts.forEach((context, id) => {
      if (context.state === 'success') {
        results.set(id, context.result);
      }
    });
    return results;
  }

  // 检查是否所有接口都已完成
  isAllCompleted(): boolean {
    return Array.from(this.contexts.values()).every(
      context => context.state === 'success' || context.state === 'failed',
    );
  }

  // 执行接口调用
  async execute(
    config: InterfaceCallConfig,
    method: HttpMethod,
    path: string,
    params: any,
    token: string,
    fileMeta?: FileEntity,
    fileData?: Buffer,
    diagnosisId?: number,
  ): Promise<Map<number, any>> {
    while (!this.isAllCompleted()) {
      const executableInterfaces = this.getExecutableInterfaces();
      
      await Promise.all(executableInterfaces.map(async (interfaceId) => {
        const request = this.requests.find(r => r.id === interfaceId);
        if (!request) return;

        try {
          await this.updateState(interfaceId, 'processing');
          
          const strategy = this.strategyFactory.createStrategy(
            request.type,
            config,
            method,
            path,
            request.params || params,
            token,
            fileMeta,
            fileData,
            diagnosisId,
            interfaceId,
          );

          const result = await strategy.execute(this.contexts.get(interfaceId)!);
          await this.updateState(interfaceId, 'success', result);
        } catch (error) {
          await this.updateState(interfaceId, 'failed', undefined, error);
        }
      }));
    }

    return this.getResults();
  }
} 