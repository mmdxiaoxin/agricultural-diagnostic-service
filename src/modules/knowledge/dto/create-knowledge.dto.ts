import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreatePlantDiseaseKnowledgeDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: '病害名称',
    example: '炭疽病',
  })
  diseaseName: string; // 病害名称

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '病害唯一编码',
    example: '01110',
  })
  diseaseCode?: string; // 病害唯一编码

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '病害学名',
    example: 'Colletotrichum gloeosporioides',
  })
  scientificName?: string; // 病害的学名（如果有）

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '病害别名',
    example: '草莓炭疽病',
  })
  synonyms?: string; // 病害的同义词

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '病害症状描述',
    example: '病害症状描述',
  })
  symptoms?: string; // 病害症状描述

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '病害病因',
    example: '病害病因',
  })
  cause?: string; // 病因

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '病害类型',
    example: '真菌性病害',
  })
  diseaseType?: string; // 病害类型

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '受影响的植物种类',
    example: '草莓',
  })
  affectedPlant?: string; // 受影响的植物种类

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '受影响的植物部位',
    example: '叶片',
  })
  affectedPart?: string; // 受影响的植物部位

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '病害生命周期',
    example: '病害生命周期',
  })
  diseaseCycle?: string; // 病害生命周期

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '病害传播方式',
    example: '病害传播方式',
  })
  spreadMethod?: string; // 病害传播方式

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '病害地理分布',
    example: '病害地理分布',
  })
  geographicalArea?: string; // 病害地理分布

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: '首次报告时间',
    example: '2021-06-01',
  })
  firstReported?: string; // 首次报告时间

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '防治措施',
    example: '防治措施',
  })
  preventiveMeasures?: string; // 防治措施

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '化学防治方法',
    example: '化学防治方法',
  })
  chemicalControl?: string; // 化学防治方法

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '生物防治方法',
    example: '生物防治方法',
  })
  biologicalControl?: string; // 生物防治方法

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '文化控制措施',
    example: '文化控制措施',
  })
  culturalPractices?: string; // 文化控制措施

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '抗病品种',
    example: '抗病品种',
  })
  resistantVarieties?: string; // 抗病品种

  @IsOptional()
  @IsString()
  @IsUrl()
  @ApiProperty({
    description: '病害图片的 URL 地址',
    example: 'https://example.com/image.jpg',
  })
  imageUrl?: string; // 病害图片的 URL 地址

  @IsOptional()
  @IsString()
  @IsUrl()
  @ApiProperty({
    description: '相关文档的 URL 地址',
    example: 'https://example.com/document.pdf',
  })
  documentUrl?: string; // 相关文档的 URL 地址

  @IsOptional()
  @IsString()
  @IsUrl()
  @ApiProperty({
    description: '相关视频的 URL 地址',
    example: 'https://example.com/video.mp4',
  })
  videoUrl?: string; // 相关视频的 URL 地址

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '病害分类',
    example: '炭疽病',
  })
  category?: string; // 病害分类

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '病害严重程度',
    example: '轻度',
  })
  severity?: string; // 病害严重程度

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '病害标签',
    example: '炭疽病, 草莓',
  })
  tags?: string; // 病害标签

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '历史病例',
    example: '历史病例',
  })
  historicalCases?: string; // 历史病例

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '研究来源',
    example: '研究来源',
  })
  researchSources?: string; // 研究来源
}
