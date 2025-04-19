import { Injectable } from '@nestjs/common';
import { InterfaceCallContext, InterfaceConfig, RequestConfig } from './interface-call.type';

@Injectable()
export class InterfaceCallManager {
  private contexts: Map<number, InterfaceCallContext> = new Map();
  private dependencies: Map<number, Set<number>> = new Map();
  private callbacks: Map<number, (context: InterfaceCallContext) => Promise<void>> = new Map();
  
  // 接口调用请求
  private requests: Array<RequestConfig> = [];
  // 接口调用配置
  private configs: Map<number, InterfaceConfig> = new Map();

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

  // 执行接口调用
  async execute(environmentVariables?: Record<string, any>): Promise<Map<number, any>> {
    while (!this.isAllCompleted()) {
      const executableInterfaces = this.getExecutableInterfaces();
      
      await Promise.all(executableInterfaces.map(async (interfaceId) => {
        const request = this.requests.find(r => r.id === interfaceId);
        if (!request) return;

        try {
          //TODO: 执行接口调用

          // 检查当前接口是否有delay配置
          if (request.delay) {
            await new Promise((resolve) => setTimeout(resolve, request.delay));
          }

          // 准备调用接口
          const config = this.configs.get(interfaceId);
          if (!config) {
            throw new Error(`未找到接口 ${interfaceId} 的配置`);
          }

          await this.updateState(interfaceId, 'success', {});
        } catch (error) {
          await this.updateState(interfaceId, 'failed', undefined, error);
        }
      }));
    }

    return this.getResults();
  }
} 