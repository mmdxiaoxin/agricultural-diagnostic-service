import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  KNOWLEDGE_SERVICE_HOST,
  KNOWLEDGE_SERVICE_NAME,
  KNOWLEDGE_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';

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
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
})
export class KnowledgeModule {}
