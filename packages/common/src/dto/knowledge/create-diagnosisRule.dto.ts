import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreateDiagnosisRuleDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: '疾病ID', required: true })
  diseaseId: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '逗号分隔的症状ID列表', required: true })
  symptomIds: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(1)
  @ApiProperty({ description: '诊断置信度（0~1）', required: true })
  probability: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '建议采取的措施', required: true })
  recommendedAction: string;
}
