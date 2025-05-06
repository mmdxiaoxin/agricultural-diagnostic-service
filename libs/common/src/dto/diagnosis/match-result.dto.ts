import { ApiProperty } from '@nestjs/swagger';
import { DiagnosisRuleConfigDto } from '../knowledge/diagnosis-rule.dto';
import { DiseaseDto } from '../knowledge/disease.dto';

// 匹配结果
export class MatchResultDto {
  @ApiProperty({
    description: '匹配分数',
    example: 1,
  })
  score: number;

  @ApiProperty({
    description: '疾病信息',
    type: DiseaseDto,
  })
  disease: DiseaseDto;

  @ApiProperty({
    description: '匹配规则',
    type: [DiagnosisRuleConfigDto],
  })
  matchedRules: DiagnosisRuleConfigDto[];
}
