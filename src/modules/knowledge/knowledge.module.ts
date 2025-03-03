import { Module } from '@nestjs/common';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlantDiseaseKnowledge } from './knowledge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlantDiseaseKnowledge])],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
})
export class KnowledgeModule {}
