import { RuleType } from '@common/types/knowledge/rule';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class DiagnosisRuleConfigDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '规则类型', required: true })
  type: RuleType;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '匹配的字段', required: true })
  field: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '匹配的值', required: true })
  value: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: '权重', required: false })
  weight?: number;
}

export class DiagnosisRuleDto {
  @IsNotEmpty()
  @IsObject()
  @ApiProperty({
    description: '诊断规则',
    required: true,
    example: {
      type: 'exact',
      field: 'class_name',
      value: '病害名称',
      weight: 1,
    },
  })
  config: DiagnosisRuleConfigDto;
}

export class CreateDiagnosisRuleDto extends DiagnosisRuleDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: '疾病ID', required: true })
  diseaseId: number;
}
