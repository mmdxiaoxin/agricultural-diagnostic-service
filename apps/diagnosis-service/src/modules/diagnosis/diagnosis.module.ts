import { DatabaseModule } from '@app/database';
import {
  DiagnosisFeedback,
  DiagnosisHistory,
  DiagnosisLog,
} from '@app/database/entities';
import { DiagnosisSupport } from '@app/database/entities/diagnosis-support.entity';
import { FileOperationModule } from '@app/file-operation';
import { RedisModule } from '@app/redis';
import { HttpService } from '@common/services/http.service';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigEnum } from '@shared/enum/config.enum';
import {
  DOWNLOAD_SERVICE_GRPC_PORT,
  DOWNLOAD_SERVICE_HOST,
  DOWNLOAD_SERVICE_NAME,
  FILE_SERVICE_HOST,
  FILE_SERVICE_NAME,
  FILE_SERVICE_TCP_PORT,
  KNOWLEDGE_SERVICE_HOST,
  KNOWLEDGE_SERVICE_NAME,
  KNOWLEDGE_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { join } from 'path';
import { DiagnosisController } from './diagnosis.controller';
import { DIAGNOSIS_PROCESSOR } from './processors';
import { DiagnosisProcessor } from './processors/diagnosis.processor';
import { DiagnosisFeedbackService } from './services/diagnosis-feedback.service';
import { DiagnosisHistoryService } from './services/diagnosis-history.service';
import { DiagnosisLogService } from './services/diagnosis-log.service';
import { DiagnosisSupportService } from './services/diagnosis-support.service';
import { DiagnosisService } from './services/diagnosis.service';
import { InterfaceCallModule } from './services/interface-call/interface-call.module';

@Module({
  imports: [
    RedisModule,
    FileOperationModule,
    InterfaceCallModule,
    DatabaseModule.forFeature([
      DiagnosisSupport,
      DiagnosisHistory,
      DiagnosisFeedback,
      DiagnosisLog,
    ]),
    ClientsModule.register([
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
      {
        name: FILE_SERVICE_NAME,
        transport: Transport.TCP,
        options: {
          host: FILE_SERVICE_HOST,
          port: FILE_SERVICE_TCP_PORT,
        },
      },
      {
        name: KNOWLEDGE_SERVICE_NAME,
        transport: Transport.TCP,
        options: {
          host: KNOWLEDGE_SERVICE_HOST,
          port: KNOWLEDGE_SERVICE_TCP_PORT,
        },
      },
    ]),
    BullModule.registerQueueAsync({
      name: DIAGNOSIS_PROCESSOR,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get(ConfigEnum.REDIS_HOST, 'localhost'),
          port: configService.get(ConfigEnum.REDIS_PORT, 6379),
          password: configService.get(ConfigEnum.REDIS_PASSWORD),
          db: configService.get(ConfigEnum.REDIS_DB, 0),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    DiagnosisService,
    HttpService,
    DiagnosisLogService,
    DiagnosisHistoryService,
    DiagnosisProcessor,
    DiagnosisFeedbackService,
    DiagnosisSupportService,
  ],
  controllers: [DiagnosisController],
  exports: [DiagnosisService, DiagnosisSupportService],
})
export class DiagnosisModule {}
