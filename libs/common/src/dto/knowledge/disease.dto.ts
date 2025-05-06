import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '../base.dto';
import { DiagnosisRuleDto } from './diagnosis-rule.dto';
import { EnvironmentFactorDto } from './environment-factor.dto';
import { SymptomDto } from './symptom.dto';
import { TreatmentDto } from './treatment.dto';

// 疾病信息
export class DiseaseDto extends BaseDto {
  @ApiProperty({
    description: '疾病名称',
    example: '大豆锈病',
  })
  name: string;

  @ApiProperty({
    description: '别名',
    example: '大豆黄锈病',
  })
  alias?: string;

  @ApiProperty({
    description: '作物ID',
    example: 4,
  })
  cropId: number;

  @ApiProperty({
    description: '发病原因',
    example: '由大豆锈病菌（Phakopsora pachyrhizi）引起，是一种真菌性病害。',
  })
  cause?: string;

  @ApiProperty({
    description: '传播方式',
    example:
      '主要通过空气传播的锈病孢子传播。病菌可以通过风力和雨水扩散，适宜的环境条件包括温暖潮湿的气候，尤其是降雨后有助于病原菌的传播。',
  })
  transmission?: string;

  @ApiProperty({
    example: 'easy',
    description: '防治难度等级',
    enum: ['easy', 'medium', 'hard'],
  })
  difficultyLevel?: string;

  @ApiProperty({
    type: [SymptomDto],
    description: '症状',
    example: [
      {
        id: 1,
        stage: '发芽期',
        imageUrl: 'https://example.com/image.jpg',
        description: '叶片上出现黄色或橙色的锈斑，后期病斑扩大并产生锈色孢子',
        createdAt: '2025-03-28T14:50:34.196Z',
        updatedAt: '2025-03-28T14:50:34.196Z',
      },
    ],
  })
  symptoms?: SymptomDto[];

  @ApiProperty({
    type: [TreatmentDto],
    description: '治疗方式',
    example: [
      {
        id: 1,
        type: 'chemical',
        method: '使用三唑酮、戊唑醇等杀菌剂进行防治',
        recommendedProducts: "'三唑酮', '戊唑醇'",
        createdAt: '2025-03-28T14:50:34.196Z',
        updatedAt: '2025-03-28T14:50:34.196Z',
      },
    ],
  })
  treatments?: TreatmentDto[];

  @ApiProperty({
    type: [EnvironmentFactorDto],
    description: '环境因素',
    example: [
      {
        id: 1,
        factor: '温度',
        optimalRange: '适宜温度范围为20-30℃',
        createdAt: '2025-03-28T14:50:34.196Z',
        updatedAt: '2025-03-28T14:50:34.196Z',
      },
    ],
  })
  environmentFactors?: EnvironmentFactorDto[];

  @ApiProperty({
    description: '诊断规则',
    type: [DiagnosisRuleDto],
    example: [
      {
        id: 7,
        config: {
          type: 'exact',
          field: 'class_name',
          value: 'Soybean___Rust',
          weight: 1,
        },
        weight: 1,
        createdAt: '2025-04-28T05:16:50.845Z',
        updatedAt: '2025-04-28T05:16:50.845Z',
        diseaseId: 13,
      },
    ],
  })
  diagnosisRules?: DiagnosisRuleDto[];
}
