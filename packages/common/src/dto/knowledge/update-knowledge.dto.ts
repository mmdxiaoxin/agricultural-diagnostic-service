import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateKnowledgeDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: '作物名称' })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '别名' })
  alias?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '发病原因' })
  cause?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '传播方式' })
  transmission?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '症状描述' })
  description?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '图片URL' })
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '生长阶段' })
  stage?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '治疗方式类型' })
  type?: 'chemical' | 'biological' | 'physical' | 'cultural';

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '治疗方式方法' })
  method?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '推荐产品' })
  recommendedProducts?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '环境因素' })
  factor?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '最佳范围' })
  optimalRange?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '逗号分隔的症状ID列表' })
  symptomIds?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @ApiProperty({ description: '诊断置信度（0~1）' })
  probability?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '建议采取的措施' })
  recommendedAction?: string;
}
