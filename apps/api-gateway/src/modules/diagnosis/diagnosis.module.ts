import {
  AIModel,
  Dataset,
  DiagnosisHistory,
  File,
  Plant,
} from '@app/database/entities';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  UPLOAD_SERVICE_NAME,
  UPLOAD_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { FileModule } from '../file/file.module';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisService } from './diagnosis.service';

@Module({
  imports: [
    FileModule,
    TypeOrmModule.forFeature([DiagnosisHistory, AIModel, Plant, File, Dataset]),
    ClientsModule.register([
      {
        name: UPLOAD_SERVICE_NAME,
        transport: Transport.TCP,
        options: {
          port: UPLOAD_SERVICE_TCP_PORT,
        },
      },
    ]),
  ],
  providers: [DiagnosisService],
  controllers: [DiagnosisController],
})
export class DiagnosisModule {}
