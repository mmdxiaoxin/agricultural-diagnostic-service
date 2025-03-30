import { DatabaseModule } from '@app/database';
import {
  Crop,
  DiagnosisRule,
  Disease,
  EnvironmentFactor,
  Symptom,
  Treatment,
} from '@app/database/entities';
import { Module } from '@nestjs/common';
import { KnowledgeController } from './knowledge.controller';
import { CropService } from './services/crop.service';
import { DiagnosisRuleService } from './services/diagnosis-rule.service';
import { DiseaseService } from './services/disease.service';
import { EnvironmentFactorService } from './services/environment-factor.service';
import { SymptomService } from './services/symptom.service';
import { TreatmentService } from './services/treatment.service';

@Module({
  imports: [
    DatabaseModule.forFeature([
      Crop,
      Disease,
      Symptom,
      Treatment,
      EnvironmentFactor,
      DiagnosisRule,
    ]),
  ],
  controllers: [KnowledgeController],
  providers: [
    CropService,
    DiseaseService,
    SymptomService,
    TreatmentService,
    EnvironmentFactorService,
    DiagnosisRuleService,
  ],
})
export class KnowledgeModule {}
