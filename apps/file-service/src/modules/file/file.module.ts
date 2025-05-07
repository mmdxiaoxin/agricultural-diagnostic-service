import { FileEntity } from '@app/database/entities';
import { FileOperationModule } from '@app/file-operation/file-operation.module';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigEnum } from '@shared/enum/config.enum';
import {
  FILE_DELETE_QUEUE,
  FileDeleteQueueProcessor,
} from './file-queue.processor';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity]),
    BullModule.registerQueueAsync({
      name: FILE_DELETE_QUEUE,
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
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
      inject: [ConfigService],
    }),
    FileOperationModule,
  ],
  controllers: [FileController],
  providers: [FileService, FileDeleteQueueProcessor],
  exports: [FileService],
})
export class FileModule {}
