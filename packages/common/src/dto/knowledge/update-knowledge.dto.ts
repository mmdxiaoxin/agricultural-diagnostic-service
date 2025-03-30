import { IsOptional, IsString } from 'class-validator';

export class UpdateKnowledgeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  alias?: string;

  @IsOptional()
  @IsString()
  cause?: string;

  @IsOptional()
  @IsString()
  transmission?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  stage?: string;

  @IsOptional()
  type?: 'chemical' | 'biological' | 'physical' | 'cultural';

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  recommendedProducts?: string;

  @IsOptional()
  @IsString()
  factor?: string;

  @IsOptional()
  @IsString()
  optimalRange?: string;

  @IsOptional()
  @IsString()
  symptomIds?: string; // 逗号分隔的症状ID列表

  @IsOptional()
  probability?: number; // 诊断置信度（0~1）

  @IsOptional()
  @IsString()
  recommendedAction?: string; // 建议采取的措施
}
