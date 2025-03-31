import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateDiagnosisRuleDto {
  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: '疾病ID', required: true })
  diseaseId: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '逗号分隔的症状ID列表', required: false })
  symptomIds?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(1)
  @ApiProperty({ description: '诊断置信度（0~1）', required: false })
  probability?: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '建议采取的措施', required: false })
  recommendedAction?: string;
}
