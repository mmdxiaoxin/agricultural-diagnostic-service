import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  FILE_SERVICE_NAME,
  FILE_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { DatasetController } from './dataset.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: FILE_SERVICE_NAME,
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: FILE_SERVICE_TCP_PORT,
        },
      },
    ]),
  ],
  controllers: [DatasetController],
})
export class DatasetModule {}
