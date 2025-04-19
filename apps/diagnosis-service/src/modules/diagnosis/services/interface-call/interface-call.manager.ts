import { Injectable } from '@nestjs/common';
import { InterfaceCallContext, InterfaceConfig, RequestConfig } from './interface-call.type';
import { InterfaceCallUtil } from './interface-call.util';
import { HttpService, BaseResponse } from '@common/services/http.service';
import { firstValueFrom } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';

@Injectable()
export class InterfaceCallManager {
  private contexts: Map<number, InterfaceCallContext> = new Map();
  private dependencies: Map<number, Set<number>> = new Map();
  private callbacks: Map<number, (context: InterfaceCallContext) => Promise<void>> = new Map();
  
  // 接口调用请求
  private requests: Array<RequestConfig> = [];
  // 接口调用配置
  private configs: Map<number, InterfaceConfig> = new Map();

  constructor(
    private readonly httpService: HttpService,
    private readonly interfaceCallUtil: InterfaceCallUtil,
  ) {}

  // 初始化方法
  initialize(requests: Array<RequestConfig>, configs: Map<number, InterfaceConfig>) {
    this.requests = requests;
    this.configs = configs;
    this.contexts.clear();
    this.dependencies.clear();
    this.callbacks.clear();

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

  // 重试机制
  private async retryWithDelay<T>(
    operation: () => Promise<T>,
    retryCount: number,
    retryDelay: number,
  ): Promise<T> {
    let lastError: Error | undefined;
    for (let i = 0; i < retryCount; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (i < retryCount - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    throw lastError;
  }

  // 轮询机制
  private async pollWithTimeout<T>(
    operation: () => Promise<T>,
    interval: number,
    maxAttempts: number,
    timeout: number,
    condition?: {
      field: string;
      operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'exists' | 'notExists';
      value?: any;
    },
  ): Promise<T> {
    const startTime = Date.now();
    let attempts = 0;

    while (attempts < maxAttempts) {
      if (Date.now() - startTime > timeout) {
        throw new Error('轮询超时');
      }

      const result = await operation();
      
      if (this.checkPollingCondition(result, condition)) {
        return result;
      }

      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    throw new Error('达到最大轮询次数');
  }

  // 检查轮询条件
  private checkPollingCondition<T>(result: T, condition?: {
    field: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'exists' | 'notExists';
    value?: any;
  }): boolean {
    if (!condition) {
      return true;
    }

    const { field, operator, value } = condition;
    const fieldValue = this.interfaceCallUtil.getNestedValue(result, field);

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'notEquals':
        return fieldValue !== value;
      case 'contains':
        return fieldValue?.includes?.(value) ?? false;
      case 'greaterThan':
        return fieldValue > value;
      case 'lessThan':
        return fieldValue < value;
      case 'exists':
        return fieldValue !== undefined;
      case 'notExists':
        return fieldValue === undefined;
      default:
        return false;
    }
  }

  // 发送请求的函数
  private async sendRequest<T>(config: InterfaceConfig, processedUrl: string, processedParams: any): Promise<T> {
    let response: BaseResponse<T>;
    
    switch (config.type.toUpperCase()) {
      case 'GET':
        response = await this.httpService.get<T>(processedUrl, { params: processedParams });
        break;
      case 'POST':
        response = await this.httpService.post<T>(processedUrl, processedParams);
        break;
      case 'PUT':
        response = await this.httpService.put<T>(processedUrl, processedParams);
        break;
      case 'DELETE':
        response = await this.httpService.delete<T>(processedUrl, { params: processedParams });
        break;
      default:
        throw new Error(`不支持的HTTP方法: ${config.type}`);
    }

    if (response.code !== 200) {
      throw new Error(response.message || '请求失败');
    }

    return response.data;
  }

  // 执行接口调用
  async execute(environmentVariables?: Record<string, any>): Promise<Map<number, any>> {
    while (!this.isAllCompleted()) {
      const executableInterfaces = this.getExecutableInterfaces();
      
      await Promise.all(executableInterfaces.map(async (interfaceId) => {
        const request = this.requests.find(r => r.id === interfaceId);
        if (!request) return;

        try {
          await this.updateState(interfaceId, 'processing');

          // 检查当前接口是否有delay配置
          if (request.delay) {
            await new Promise((resolve) => setTimeout(resolve, request.delay));
          }

          // 准备调用接口
          const config = this.configs.get(interfaceId);
          if (!config) {
            throw new Error(`未找到接口 ${interfaceId} 的配置`);
          }

          // 处理URL和参数
          const processedUrl = this.interfaceCallUtil.processUrlTemplate(
            config.url,
            request.params || {},
            this.getResults(),
          );

          const processedParams = this.interfaceCallUtil.processParams(
            request.params || {},
            this.getResults(),
            config.url,
          );

          let result;
          if (request.type === 'polling') {
            result = await this.pollWithTimeout(
              () => this.sendRequest(config, processedUrl, processedParams),
              request.interval || 3000,
              request.maxAttempts || 20,
              request.timeout || 60000,
              request.pollingCondition,
            );
          } else if (request.retryCount && request.retryCount > 0) {
            result = await this.retryWithDelay(
              () => this.sendRequest(config, processedUrl, processedParams),
              request.retryCount,
              request.retryDelay || 1000,
            );
          } else {
            result = await this.sendRequest(config, processedUrl, processedParams);
          }

          await this.updateState(interfaceId, 'success', result);
        } catch (error) {
          if (error instanceof AxiosError) {
            await this.updateState(interfaceId, 'failed', undefined, new Error(error.response?.data?.message || error.message));
          } else {
            await this.updateState(interfaceId, 'failed', undefined, error as Error);
          }
        }
      }));
    }

    return this.getResults();
  }
} 