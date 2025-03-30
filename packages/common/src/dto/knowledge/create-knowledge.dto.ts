import { IsNotEmpty, IsObject } from 'class-validator';
import { CropDto } from './crop.dto';
import { DiseaseDto } from './disease.dto';
import { SymptomDto } from './symptom.dto';
import { TreatmentDto } from './treatment.dto';
import { EnvironmentFactorDto } from './environment-factor.dto';
import { DiagnosisRuleDto } from './diagnosis-rule.dto';

export class CreateKnowledgeDto {
  @IsNotEmpty()
  @IsObject()
  crop: CropDto;

  @IsNotEmpty()
  @IsObject()
  disease: DiseaseDto;

  @IsNotEmpty()
  @IsObject()
  symptom: SymptomDto;

  @IsNotEmpty()
  @IsObject()
  treatment: TreatmentDto;

  @IsNotEmpty()
  @IsObject()
  environmentFactor: EnvironmentFactorDto;

  @IsNotEmpty()
  @IsObject()
  diagnosisRule: DiagnosisRuleDto;
}
