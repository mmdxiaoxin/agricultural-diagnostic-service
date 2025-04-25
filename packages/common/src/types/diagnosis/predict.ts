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

export type PredictionData = {
  predictions?: Prediction[];
  status: 'success' | 'failed';
  task_id: string;
};
