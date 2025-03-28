import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  DIAGNOSIS_SERVICE_HOST,
  DIAGNOSIS_SERVICE_NAME,
  DIAGNOSIS_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { RemoteController } from './remote.controller';
import { RemoteService } from './remote.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: DIAGNOSIS_SERVICE_NAME,
        transport: Transport.TCP,
        options: {
          host: DIAGNOSIS_SERVICE_HOST,
          port: DIAGNOSIS_SERVICE_TCP_PORT,
        },
      },
    ]),
  ],
  controllers: [RemoteController],
  providers: [RemoteService],
})
export class RemoteModule {}
