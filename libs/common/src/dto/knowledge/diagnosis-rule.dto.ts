import { ApiProperty } from '@nestjs/swagger';

// 诊断规则配置
export class DiagnosisRuleConfigDto {
  @ApiProperty({
    description: '规则类型',
    example: 'exact',
  })
  type: string;

  @ApiProperty({
    description: '匹配字段',
    example: 'class_name',
  })
  field: string;

  @ApiProperty({
    description: '匹配值',
    example: 'Soybean___Rust',
  })
  value: string;

  @ApiProperty({
    description: '权重',
    example: 1,
  })
  weight: number;
}

// 诊断规则
export class DiagnosisRuleDto {
  @ApiProperty({
    description: '规则ID',
    example: 7,
  })
  id: number;

  @ApiProperty({
    description: '规则配置',
    type: DiagnosisRuleConfigDto,
  })
  config: DiagnosisRuleConfigDto;

  @ApiProperty({
    description: '权重',
    example: 1,
  })
  weight: number;

  @ApiProperty({
    description: '创建时间',
    example: '2025-04-28T05:16:50.845Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '疾病ID',
    example: 13,
  })
  diseaseId: number;

  @ApiProperty({
    description: '更新时间',
    example: '2025-04-28T05:16:50.845Z',
  })
  updatedAt: Date;
}
