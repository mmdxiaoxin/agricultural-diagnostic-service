import { AliOssModule } from '@app/ali-oss';
import { DatabaseModule } from '@app/database';
import {
  Crop,
  DiagnosisRule,
  Disease,
  EnvironmentFactor,
  Symptom,
  Treatment,
} from '@app/database/entities';
import { RedisService } from '@app/redis';
import { Module } from '@nestjs/common';
import { CropController } from './controllers/crop.controller';
import { DiagnosisRuleController } from './controllers/diagnosis-rule.controller';
import { DiseaseController } from './controllers/disease.controller';
import { EnvironmentFactorController } from './controllers/environment-factor.controller';
import { KnowledgeController } from './controllers/knowledge.controller';
import { SymptomController } from './controllers/symptom.controller';
import { TreatmentController } from './controllers/treatment.controller';
import { CropService } from './services/crop.service';
import { DiagnosisRuleService } from './services/diagnosis-rule.service';
import { DiseaseService } from './services/disease.service';
import { EnvironmentFactorService } from './services/environment-factor.service';
import { KnowledgeService } from './services/knowledge.service';
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
    AliOssModule,
  ],
  controllers: [
    CropController,
    DiseaseController,
    SymptomController,
    TreatmentController,
    EnvironmentFactorController,
    DiagnosisRuleController,
    KnowledgeController,
  ],
  providers: [
    CropService,
    DiseaseService,
    RedisService,
    SymptomService,
    TreatmentService,
    EnvironmentFactorService,
    DiagnosisRuleService,
    KnowledgeService,
  ],
})
export class KnowledgeModule {}
