import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  KNOWLEDGE_SERVICE_HOST,
  KNOWLEDGE_SERVICE_NAME,
  KNOWLEDGE_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { SymptomController } from './symptom.controller';
import { SymptomService } from './symptom.service';

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
  controllers: [SymptomController],
  providers: [SymptomService],
})
export class SymptomModule {}
