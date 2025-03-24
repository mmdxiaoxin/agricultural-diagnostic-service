import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  DIAGNOSIS_SERVICE_NAME,
  DIAGNOSIS_SERVICE_TCP_PORT,
  UPLOAD_SERVICE_NAME,
  UPLOAD_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisService } from './diagnosis.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: UPLOAD_SERVICE_NAME,
        transport: Transport.TCP,
        options: {
          port: UPLOAD_SERVICE_TCP_PORT,
        },
      },
      {
        name: DIAGNOSIS_SERVICE_NAME,
        transport: Transport.TCP,
        options: {
          port: DIAGNOSIS_SERVICE_TCP_PORT,
        },
      },
    ]),
  ],
  controllers: [DiagnosisController],
  providers: [DiagnosisService],
})
export class DiagnosisModule {}
