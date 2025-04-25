import { FileEntity } from '@app/database/entities';
import { RemoteInterface } from '@app/database/entities/remote-interface.entity';

/**
 * 接口调用状态枚举
 */
export enum InterfaceCallState {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

/**
 * 接口调用上下文
 */
export interface InterfaceCallContext {
  id: number;
  state: InterfaceCallState;
  result?: any;
  error?: Error;
  retryCount: number;
  startTime: number;
  endTime?: number;
}

/**
 * 轮询条件操作符
 */
export enum PollingOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  CONTAINS = 'contains',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  EXISTS = 'exists',
  NOT_EXISTS = 'notExists',
}

/**
 * 轮询条件配置
 */
export interface PollingCondition {
  field: string;
  operator: PollingOperator;
  value?: any;
}

/**
 * 请求配置
 */
export interface RequestConfig {
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
  pollingCondition?: PollingCondition;
}

/**
 * 接口配置
 */
export type InterfaceConfig = Pick<RemoteInterface, 'config' | 'url' | 'type'>;

/**
 * 环境变量
 */
export interface EnvironmentVariables {
  token?: string;
  fileMeta?: FileEntity;
  fileData?: Buffer;
  [key: string]: any;
}
