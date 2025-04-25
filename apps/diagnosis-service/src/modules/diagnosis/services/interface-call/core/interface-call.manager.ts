import { RequestConfig } from '@app/database/entities';
import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import * as FormData from 'form-data';
import { PollingHandler } from '../handlers/polling-handler';
import { RequestHandler } from '../handlers/request-handler';
import { RetryHandler } from '../handlers/retry-handler';
import {
  EnvironmentVariables,
  InterfaceCallContext,
  InterfaceCallState,
  InterfaceConfig,
} from '../types/interface-call.types';
import { ParamProcessorUtil } from '../utils/param-processor.util';
import { UrlProcessorUtil } from '../utils/url-processor.util';

@Injectable()
export class InterfaceCallManager {
  private contexts: Map<number, InterfaceCallContext> = new Map();
  private dependencies: Map<number, Set<number>> = new Map();
  private callbacks: Map<
    number,
    (context: InterfaceCallContext) => Promise<void>
  > = new Map();
  private requests: Array<RequestConfig> = [];
  private configs: Map<number, InterfaceConfig> = new Map();

  constructor(
    private readonly urlProcessor: UrlProcessorUtil,
    private readonly paramProcessor: ParamProcessorUtil,
    private readonly requestHandler: RequestHandler,
    private readonly pollingHandler: PollingHandler,
    private readonly retryHandler: RetryHandler,
  ) {}

  /**
   * 初始化
   */
  initialize(
    diagnosisId: number,
    requests: Array<RequestConfig>,
    configs: Map<number, InterfaceConfig>,
  ) {
    this.requests = requests;
    this.configs = configs;
    this.contexts.clear();
    this.dependencies.clear();
    this.callbacks.clear();

    // 初始化各个处理器
    this.urlProcessor.initialize(diagnosisId);
    this.paramProcessor.initialize(diagnosisId);
    this.requestHandler.initialize(diagnosisId);
    this.pollingHandler.initialize(diagnosisId);
    this.retryHandler.initialize(diagnosisId);

    // 初始化上下文
    requests.forEach((request) => {
      this.contexts.set(request.id, {
        id: request.id,
        state: InterfaceCallState.PENDING,
        retryCount: 0,
        startTime: Date.now(),
      });

      if (request.next && request.next.length > 0) {
        this.dependencies.set(request.id, new Set(request.next));
      }
    });
  }

  /**
   * 注册回调
   */
  registerCallback(
    id: number,
    callback: (context: InterfaceCallContext) => Promise<void>,
  ) {
    this.callbacks.set(id, callback);
  }

  /**
   * 获取可执行的接口
   */
  getExecutableInterfaces(): number[] {
    return Array.from(this.contexts.entries())
      .filter(([id, context]) => {
        if (context.state !== 'pending') {
          return false;
        }

        const deps = this.dependencies.get(id);
        if (!deps || deps.size === 0) {
          return true;
        }

        return Array.from(deps).every((depId) => {
          const depContext = this.contexts.get(depId);
          return depContext?.state === 'success';
        });
      })
      .map(([id]) => id);
  }

  /**
   * 更新状态
   */
  async updateState(
    id: number,
    state: InterfaceCallState,
    result?: any,
    error?: Error,
  ) {
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

    const callback = this.callbacks.get(id);
    if (callback) {
      await callback(context);
    }
  }

  /**
   * 获取结果
   */
  getResults(): Map<number, any> {
    const results = new Map<number, any>();
    this.contexts.forEach((context, id) => {
      if (context.state === 'success') {
        results.set(id, context.result);
      }
    });
    return results;
  }

  /**
   * 检查是否所有接口都已完成
   */
  isAllCompleted(): boolean {
    return Array.from(this.contexts.values()).every(
      (context) => context.state === 'success' || context.state === 'failed',
    );
  }

  /**
   * 执行接口调用
   * @param environmentVariables 环境变量
   * @returns 结果
   */
  async execute(
    environmentVariables?: EnvironmentVariables,
  ): Promise<Map<number, any>> {
    // 获取所有没有依赖的接口作为第一级
    const firstLevelInterfaces = this.requests
      .filter((request) => {
        // 检查这个接口是否被其他接口依赖
        const isDependent = this.requests.some(
          (otherRequest) =>
            otherRequest.next && otherRequest.next.includes(request.id),
        );
        return !isDependent;
      })
      .map((request) => request.id);

    // 并发执行第一级接口
    await Promise.all(
      firstLevelInterfaces.map((interfaceId) =>
        this.executeInterface(interfaceId, environmentVariables),
      ),
    );

    return this.getResults();
  }

  /**
   * 递归执行单个接口及其后续接口
   * @param interfaceId 接口ID
   * @param environmentVariables 环境变量
   */
  private async executeInterface(
    interfaceId: number,
    environmentVariables?: EnvironmentVariables,
  ): Promise<void> {
    const request = this.requests.find((r) => r.id === interfaceId);
    if (!request) return;

    try {
      await this.updateState(interfaceId, InterfaceCallState.PROCESSING);

      if (request.delay) {
        await new Promise((resolve) => setTimeout(resolve, request.delay));
      }

      const interfaceConfig = this.configs.get(interfaceId);
      if (!interfaceConfig) {
        throw new Error(`未找到接口 ${interfaceId} 的配置`);
      }

      const { url, config } = interfaceConfig;
      const { method = 'GET', prefix, path, ...axiosConfig } = config;

      const fullUrl = `${url}${prefix || ''}${path || ''}`;
      const processedUrl = this.urlProcessor.processUrlTemplate(
        fullUrl,
        request.params || {},
        this.getResults(),
      );

      if (!processedUrl) {
        throw new Error(`处理URL失败: ${fullUrl}`);
      }

      const processedParams = this.paramProcessor.processParams(
        request.params || {},
        this.getResults(),
        fullUrl,
        environmentVariables?.fileMeta,
        environmentVariables?.fileData,
      );

      const requestConfig: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${environmentVariables?.token}`,
          ...(processedParams instanceof FormData
            ? processedParams.getHeaders()
            : { 'Content-Type': 'application/json' }),
        },
        ...axiosConfig,
        timeout: request.timeout || 60000,
      };

      let result;
      if (request.type === 'polling') {
        result = await this.pollingHandler.pollWithTimeout(
          () =>
            this.requestHandler.sendRequest(
              method,
              processedUrl,
              processedParams,
              requestConfig,
            ),
          request.interval || 3000,
          request.maxAttempts || 20,
          request.timeout || 60000,
          request.pollingCondition,
        );
      } else if (request.retryCount && request.retryCount > 0) {
        result = await this.retryHandler.retryWithDelay(
          () =>
            this.requestHandler.sendRequest(
              method,
              processedUrl,
              processedParams,
              requestConfig,
            ),
          request.retryCount,
          request.retryDelay || 1000,
        );
      } else {
        result = await this.requestHandler.sendRequest(
          method,
          processedUrl,
          processedParams,
          requestConfig,
        );
      }

      await this.updateState(interfaceId, InterfaceCallState.SUCCESS, result);

      // 递归执行后续接口
      if (request.next && request.next.length > 0) {
        await Promise.all(
          request.next.map((nextId) =>
            this.executeInterface(nextId, environmentVariables),
          ),
        );
      }
    } catch (error) {
      await this.updateState(
        interfaceId,
        InterfaceCallState.FAILED,
        undefined,
        error as Error,
      );
    }
  }
}
