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
  @ApiProperty({ description: '疾病ID' })
  diseaseId?: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '逗号分隔的症状ID列表' })
  symptomIds?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(1)
  @ApiProperty({ description: '诊断置信度（0~1）' })
  probability?: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '建议采取的措施' })
  recommendedAction?: string;
}
