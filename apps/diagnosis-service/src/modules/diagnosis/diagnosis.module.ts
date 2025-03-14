import { DatabaseModule } from '@app/database';
import {
  AIModel,
  AiService,
  AiServiceAccessLog,
  AiServiceConfig,
  AiServiceLog,
  DiagnosisHistory,
  Plant,
} from '@app/database/entities';
import { FileOperationModule } from '@app/file-operation';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  DOWNLOAD_SERVICE_NAME,
  DOWNLOAD_SERVICE_TCP_PORT,
  FILE_SERVICE_NAME,
  FILE_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisService } from './diagnosis.service';

@Module({
  imports: [
    FileOperationModule,
    DatabaseModule.forFeature([
      DiagnosisHistory,
      AIModel,
      Plant,
      AiService,
      AiServiceConfig,
      AiServiceAccessLog,
      AiServiceLog,
    ]),
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
  providers: [DiagnosisService],
  controllers: [DiagnosisController],
})
export class DiagnosisModule {}
