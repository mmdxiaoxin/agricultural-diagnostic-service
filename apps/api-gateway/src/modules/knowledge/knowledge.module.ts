import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  KNOWLEDGE_SERVICE_HOST,
  KNOWLEDGE_SERVICE_NAME,
  KNOWLEDGE_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { CropModule } from './crop/crop.module';
import { DiseaseModule } from './disease/disease.module';
import { EnvironmentFactorModule } from './environment-factor/environment-factor.module';
import { SymptomModule } from './symptom/symptom.module';
import { DiagnosisRuleModule } from './diagnosis-rule/diagnosis-rule.module';
import { TreatmentModule } from './treatment/treatment.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: KNOWLEDGE_SERVICE_NAME,
        transport: Transport.TCP,
        options: {
          host: KNOWLEDGE_SERVICE_HOST,
          port: KNOWLEDGE_SERVICE_TCP_PORT,
        },
      },
    ]),
    CropModule,
    DiseaseModule,
    EnvironmentFactorModule,
    SymptomModule,
    DiagnosisRuleModule,
    TreatmentModule,
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
})
export class KnowledgeModule {}
