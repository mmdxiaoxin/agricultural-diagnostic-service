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
  type: 'single' | 'polling'; // 调用类型：单次调用或轮询
  interval?: number; // 轮询间隔（毫秒）
  maxAttempts?: number; // 最大尝试次数
  timeout?: number; // 超时时间（毫秒）
  retryCount?: number; // 重试次数
  retryDelay?: number; // 重试延迟（毫秒）
}

export interface DiagnosisConfig {
  baseUrl: string;
  urlPrefix: string;
  urlPath: string;
  interfaceConfig: InterfaceCallConfig;
}
