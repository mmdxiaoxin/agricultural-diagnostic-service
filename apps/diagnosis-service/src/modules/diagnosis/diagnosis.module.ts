import { DatabaseModule } from '@app/database';
import { DiagnosisHistory } from '@app/database/entities';
import { FileOperationModule } from '@app/file-operation';
import { HttpService } from '@common/services/http.service';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  DOWNLOAD_SERVICE_GRPC_PORT,
  DOWNLOAD_SERVICE_HOST,
  FILE_SERVICE_NAME,
  FILE_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { join } from 'path';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisHttpService } from './services/diagnosis-http.service';
import { DiagnosisService } from './services/diagnosis.service';

@Module({
  imports: [
    FileOperationModule,
    DatabaseModule.forFeature([DiagnosisHistory]),
    ClientsModule.register([
      {
        name: 'DOWNLOAD_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'download',
          protoPath: join(__dirname, 'modules/diagnosis/proto/download.proto'),
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
      {
        name: FILE_SERVICE_NAME,
        transport: Transport.TCP,
        options: {
          port: FILE_SERVICE_TCP_PORT,
        },
      },
    ]),
  ],
  providers: [DiagnosisService, DiagnosisHttpService, HttpService],
  controllers: [DiagnosisController],
  exports: [DiagnosisService],
})
export class DiagnosisModule {}
