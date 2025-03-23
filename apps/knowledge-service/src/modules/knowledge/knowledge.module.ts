import { DatabaseModule } from '@app/database';
import { PlantDiseaseKnowledge } from '@app/database/entities';
import { Module } from '@nestjs/common';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';

@Module({
  imports: [DatabaseModule.forFeature([PlantDiseaseKnowledge])],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
})
export class KnowledgeModule {}
