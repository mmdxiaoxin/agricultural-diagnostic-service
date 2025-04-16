import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class DiagnosisRuleDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '诊断规则',
    required: true,
    example: 'class_name=病害名称,class_name=病害别名',
  })
  schema: string;
}

export class CreateDiagnosisRuleDto extends DiagnosisRuleDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: '疾病ID', required: true })
  diseaseId: number;
}
