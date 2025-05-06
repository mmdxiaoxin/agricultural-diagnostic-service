import { ApiProperty } from '@nestjs/swagger';
import { DiagnosisRuleDto } from './diagnosis-rule.dto';
import { CropDto } from './crop.dto';

// 疾病信息
export class DiseaseDto {
  @ApiProperty({
    description: '疾病ID',
    example: 13,
  })
  id: number;

  @ApiProperty({
    description: '疾病名称',
    example: '大豆锈病',
  })
  name: string;

  @ApiProperty({
    description: '疾病别名',
    example: '大豆黄锈病',
  })
  alias: string;

  @ApiProperty({
    description: '病因',
    example: '由大豆锈病菌（Phakopsora pachyrhizi）引起，是一种真菌性病害。',
  })
  cause: string;

  @ApiProperty({
    description: '作物ID',
    example: 4,
  })
  cropId: number;

  @ApiProperty({
    description: '作物信息',
    type: CropDto,
  })
  crop: CropDto;

  @ApiProperty({
    description: '传播方式',
    example:
      '主要通过空气传播的锈病孢子传播。病菌可以通过风力和雨水扩散，适宜的环境条件包括温暖潮湿的气候，尤其是降雨后有助于病原菌的传播。',
  })
  transmission: string;

  @ApiProperty({
    description: '诊断规则',
    type: [DiagnosisRuleDto],
  })
  diagnosisRules: DiagnosisRuleDto[];

  @ApiProperty({
    description: '难度等级',
    example: 'easy',
  })
  difficultyLevel: string;

  @ApiProperty({
    description: '创建时间',
    example: '2025-04-28T05:15:24.291Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '更新时间',
    example: '2025-04-28T14:17:29.422Z',
  })
  updatedAt: Date;
}
