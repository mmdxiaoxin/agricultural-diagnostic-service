import { RemoteInterface } from "@app/database/entities/remote-interface.entity";

export interface InterfaceCallContext {
  id: number;
  state: 'pending' | 'processing' | 'success' | 'failed' | 'retrying';
  result?: any;
  error?: Error;
  retryCount: number;
  startTime: number;
  endTime?: number;
}

export type RequestConfig = {
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
}

export type InterfaceConfig = Pick<RemoteInterface, 'config' | 'url' | 'type'>;
