import { DatabaseModule } from '@app/database';
import { DiagnosisHistory } from '@app/database/entities';
import { FileOperationModule } from '@app/file-operation';
import { HttpService } from '@common/services/http.service';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  DOWNLOAD_SERVICE_NAME,
  DOWNLOAD_SERVICE_TCP_PORT,
  FILE_SERVICE_NAME,
  FILE_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisHttpService } from './services/diagnosis-http.service';
import { DiagnosisService } from './services/diagnosis.service';

@Module({
  imports: [
    FileOperationModule,
    DatabaseModule.forFeature([DiagnosisHistory]),
    ClientsModule.register([
      {
        name: DOWNLOAD_SERVICE_NAME,
        transport: Transport.TCP,
        options: {
          port: DOWNLOAD_SERVICE_TCP_PORT,
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
