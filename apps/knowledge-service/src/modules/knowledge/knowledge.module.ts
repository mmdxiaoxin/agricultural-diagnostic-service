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
import { KnowledgeService } from './knowledge.service';

@Module({
  imports: [
    DatabaseModule.forFeature([
      Crop,
      Disease,
      DiagnosisRule,
      EnvironmentFactor,
      Treatment,
      Symptom,
    ]),
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
})
export class KnowledgeModule {}
