// 基础预测类型
export type BasePrediction = {
  class_id: number;
  class_name: string;
  confidence: number;
};

// 检测框类型
export type BBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// 分类预测
export type ClassifyPrediction = BasePrediction & {
  type: 'classify';
  top5: BasePrediction[];
};

// 检测预测
export type DetectPrediction = BasePrediction & {
  type: 'detect';
  bbox: BBox;
  area: number;
};

// 预测结果联合类型
export type Prediction = ClassifyPrediction | DetectPrediction;

export interface CreateDiagnosisTaskResponse {
  taskId: string;
  status: string;
  message: string;
}

export interface DiagnosisTaskResponse {
  taskId: string;
  status: string;
  message: string;
  result: string;
}

export interface InterfaceCallConfig {
  type?: 'single' | 'polling'; // 调用类型
  interval?: number; // 轮询间隔（毫秒）
  maxAttempts?: number; // 最大尝试次数
  timeout?: number; // 超时时间（毫秒）
  retryCount?: number; // 重试次数
  retryDelay?: number; // 重试延迟（毫秒）
  polling?: boolean; //是否开启轮询
  next?: number[]; // 下一个接口ID
  params?: Record<string, any>; // 调用需要传入的参数
  headers?: Record<string, string>; // 请求头
  validateStatus?: (status: number) => boolean; // 验证响应状态
  pollingCondition?: {
    field: string; // 要检查的字段路径，支持点号分隔
    operator:
      | 'equals'
      | 'notEquals'
      | 'contains'
      | 'greaterThan'
      | 'lessThan'
      | 'exists'
      | 'notExists';
    value?: any; // 比较值，对于 exists/notExists 操作符不需要
  };
}

export interface DiagnosisConfig {
  baseUrl: string;
  urlPrefix: string;
  urlPath: string;
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
    headers?: Record<string, string>;
    validateStatus?: (status: number) => boolean;
    pollingCondition?: {
      field: string;
      operator:
        | 'equals'
        | 'notEquals'
        | 'contains'
        | 'greaterThan'
        | 'lessThan'
        | 'exists'
        | 'notExists';
      value?: any;
    };
  }>;
}
