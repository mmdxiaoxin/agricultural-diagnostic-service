import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  DIAGNOSIS_SERVICE_NAME,
  DIAGNOSIS_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { AiServiceController } from './ai-service.controller';
import { AiServiceService } from './ai-service.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: DIAGNOSIS_SERVICE_NAME,
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: DIAGNOSIS_SERVICE_TCP_PORT,
        },
      },
    ]),
  ],
  controllers: [AiServiceController],
  providers: [AiServiceService],
})
export class AiServiceModule {}
