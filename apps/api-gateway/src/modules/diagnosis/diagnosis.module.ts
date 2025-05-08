import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  DIAGNOSIS_SERVICE_NAME,
  DIAGNOSIS_SERVICE_TCP_PORT,
  UPLOAD_SERVICE_NAME,
  UPLOAD_SERVICE_HOST,
  UPLOAD_SERVICE_GRPC_PORT,
} from 'config/microservice.config';
import { join } from 'path';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisService } from './diagnosis.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: UPLOAD_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          package: 'upload',
          protoPath: join(__dirname, 'proto/upload.proto'),
          url: `${UPLOAD_SERVICE_HOST}:${UPLOAD_SERVICE_GRPC_PORT}`,
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
