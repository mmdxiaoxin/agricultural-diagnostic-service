import { IsNotEmpty, IsString } from 'class-validator';

export class DiagnosisRuleDto {
  @IsNotEmpty()
  @IsString()
  symptomIds: string; // 逗号分隔的症状ID列表

  @IsNotEmpty()
  probability: number; // 诊断置信度（0~1）

  @IsNotEmpty()
  @IsString()
  recommendedAction: string; // 建议采取的措施
}
