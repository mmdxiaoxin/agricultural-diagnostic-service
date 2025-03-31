import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { DiagnosisRuleDto } from './create-diagnosisRule.dto';
import { EnvironmentFactorDto } from './create-environmentFactor.dto';
import { SymptomDto } from './create-symptom.dto';
import { TreatmentDto } from './create-treatment.dto';

export class CreateKnowledgeDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '疾病名称', required: true })
  name: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '别名', required: false })
  alias?: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: '作物ID', required: true })
  cropId: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '发病原因', required: false })
  cause?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: '传播方式', required: false })
  transmission?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'easy',
    description: '防治难度等级',
    required: false,
  })
  difficultyLevel?: number;

  @IsOptional()
  @IsArray()
  @ApiProperty({ type: [SymptomDto], description: '症状' })
  symptoms?: SymptomDto[];

  @IsOptional()
  @IsArray()
  @ApiProperty({ type: [TreatmentDto], description: '治疗方式' })
  treatments?: TreatmentDto[];

  @IsOptional()
  @IsArray()
  @ApiProperty({ type: [EnvironmentFactorDto], description: '环境因素' })
  environmentFactors?: EnvironmentFactorDto[];

  @IsOptional()
  @IsArray()
  @ApiProperty({
    example: [
      {
        name: '不必提交该属性，创建更新不会使用',
      },
    ],
    description: '诊断规则',
  })
  diagnosisRules?: DiagnosisRuleDto[];
}
