import { IsNotEmpty, IsObject } from 'class-validator';
import { CreateCropDto } from './create-crop.dto';
import { CreateDiseaseDto } from './create-disease.dto';
import { CreateSymptomDto } from './create-symptom.dto';
import { CreateTreatmentDto } from './create-treatment.dto';
import { CreateEnvironmentFactorDto } from './create-environmentFactor.dto';
import { CreateDiagnosisRuleDto } from './create-diagnosisRule.dto';

export class CreateKnowledgeDto {
  @IsNotEmpty()
  @IsObject()
  crop: CreateCropDto;

  @IsNotEmpty()
  @IsObject()
  disease: CreateDiseaseDto;

  @IsNotEmpty()
  @IsObject()
  symptom: CreateSymptomDto;

  @IsNotEmpty()
  @IsObject()
  treatment: CreateTreatmentDto;

  @IsNotEmpty()
  @IsObject()
  environmentFactor: CreateEnvironmentFactorDto;

  @IsNotEmpty()
  @IsObject()
  diagnosisRule: CreateDiagnosisRuleDto;
}
