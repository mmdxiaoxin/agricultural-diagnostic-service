import { IsNotEmpty, IsObject } from 'class-validator';
import { CreateCropDto } from './create-crop.dto';
import { CreateDiseaseDto } from './create-disease.dto';
import { CreateSymptomDto } from './create-symptom.dto';
import { CreateTreatmentDto } from './create-treatment.dto';
import { CreateEnvironmentFactorDto } from './create-environmentFactor.dto';
import { CreateDiagnosisRuleDto } from './create-diagnosisRule.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateKnowledgeDto {
  @IsNotEmpty()
  @IsObject()
  @ApiProperty({ description: '作物' })
  crop: CreateCropDto;

  @IsNotEmpty()
  @IsObject()
  @ApiProperty({ description: '疾病' })
  disease: CreateDiseaseDto;

  @IsNotEmpty()
  @IsObject()
  @ApiProperty({ description: '症状' })
  symptom: CreateSymptomDto;

  @IsNotEmpty()
  @IsObject()
  @ApiProperty({ description: '治疗方式' })
  treatment: CreateTreatmentDto;

  @IsNotEmpty()
  @IsObject()
  @ApiProperty({ description: '环境因素' })
  environmentFactor: CreateEnvironmentFactorDto;

  @IsNotEmpty()
  @IsObject()
  @ApiProperty({ description: '诊断规则' })
  diagnosisRule: CreateDiagnosisRuleDto;
}
