import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeController } from './knowledge.controller';
import { PlantDiseaseKnowledge } from './knowledge.entity';
import { KnowledgeManageService } from './services/knowledge-manage.service';
import { KnowledgeService } from './services/knowledge.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlantDiseaseKnowledge])],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, KnowledgeManageService],
})
export class KnowledgeModule {}
