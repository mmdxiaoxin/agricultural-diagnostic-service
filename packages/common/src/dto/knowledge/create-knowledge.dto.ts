import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
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
}
