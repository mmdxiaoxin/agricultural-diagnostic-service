import { Module } from '@nestjs/common';
import { KnowledgeServiceController } from './knowledge-service.controller';
import { KnowledgeServiceService } from './knowledge-service.service';

@Module({
  imports: [],
  controllers: [KnowledgeServiceController],
  providers: [KnowledgeServiceService],
})
export class KnowledgeServiceModule {}
