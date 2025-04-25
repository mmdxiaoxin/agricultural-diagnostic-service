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
