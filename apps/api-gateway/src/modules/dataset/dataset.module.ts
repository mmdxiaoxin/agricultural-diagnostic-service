import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  FILE_SERVICE_HOST,
  FILE_SERVICE_NAME,
  FILE_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { DatasetController } from './dataset.controller';
import { DatasetService } from './dataset.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: FILE_SERVICE_NAME,
        transport: Transport.TCP,
        options: {
          host: FILE_SERVICE_HOST,
          port: FILE_SERVICE_TCP_PORT,
        },
      },
    ]),
  ],
  controllers: [DatasetController],
  providers: [DatasetService],
})
export class DatasetModule {}
