import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  DOWNLOAD_SERVICE_GRPC_PORT,
  DOWNLOAD_SERVICE_HOST,
  DOWNLOAD_SERVICE_NAME,
  FILE_SERVICE_HOST,
  FILE_SERVICE_NAME,
  FILE_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { DatasetController } from './dataset.controller';
import { DatasetService } from './dataset.service';
import { join } from 'path';

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
      {
        name: DOWNLOAD_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          package: 'download',
          protoPath: join(__dirname, 'proto/download.proto'),
          url: `${DOWNLOAD_SERVICE_HOST}:${DOWNLOAD_SERVICE_GRPC_PORT}`,
          loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
            arrays: true,
          },
        },
      },
    ]),
  ],
  controllers: [DatasetController],
  providers: [DatasetService],
})
export class DatasetModule {}
