import { IsOptional, IsString, IsDateString, IsUrl } from 'class-validator';

export class CreatePlantDiseaseKnowledgeDto {
  @IsString()
  diseaseName: string; // 病害名称

  @IsOptional()
  @IsString()
  diseaseCode?: string; // 病害唯一编码

  @IsOptional()
  @IsString()
  scientificName?: string; // 病害的学名（如果有）

  @IsOptional()
  @IsString()
  synonyms?: string; // 病害的同义词

  @IsOptional()
  @IsString()
  symptoms?: string; // 病害症状描述

  @IsOptional()
  @IsString()
  cause?: string; // 病因

  @IsOptional()
  @IsString()
  diseaseType?: string; // 病害类型

  @IsOptional()
  @IsString()
  affectedPlant?: string; // 受影响的植物种类

  @IsOptional()
  @IsString()
  affectedPart?: string; // 受影响的植物部位

  @IsOptional()
  @IsString()
  diseaseCycle?: string; // 病害生命周期

  @IsOptional()
  @IsString()
  spreadMethod?: string; // 病害传播方式

  @IsOptional()
  @IsString()
  geographicalArea?: string; // 病害地理分布

  @IsOptional()
  @IsDateString()
  firstReported?: string; // 首次报告时间

  @IsOptional()
  @IsString()
  preventiveMeasures?: string; // 防治措施

  @IsOptional()
  @IsString()
  chemicalControl?: string; // 化学防治方法

  @IsOptional()
  @IsString()
  biologicalControl?: string; // 生物防治方法

  @IsOptional()
  @IsString()
  culturalPractices?: string; // 文化控制措施

  @IsOptional()
  @IsString()
  resistantVarieties?: string; // 抗病品种

  @IsOptional()
  @IsString()
  @IsUrl()
  imageUrl?: string; // 病害图片的 URL 地址

  @IsOptional()
  @IsString()
  @IsUrl()
  documentUrl?: string; // 相关文档的 URL 地址

  @IsOptional()
  @IsString()
  @IsUrl()
  videoUrl?: string; // 相关视频的 URL 地址

  @IsOptional()
  @IsString()
  category?: string; // 病害分类

  @IsOptional()
  @IsString()
  severity?: string; // 病害严重程度

  @IsOptional()
  @IsString()
  tags?: string; // 病害标签

  @IsOptional()
  @IsString()
  historicalCases?: string; // 历史病例

  @IsOptional()
  @IsString()
  researchSources?: string; // 研究来源
}
