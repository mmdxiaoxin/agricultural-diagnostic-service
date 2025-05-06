import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '../base.dto';

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
export class DiagnosisRuleDto extends BaseDto {
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
    description: '疾病ID',
    example: 13,
  })
  diseaseId: number;
}
