import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from '@app/database/entities';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { FileDeleteQueueProcessor } from './file-queue.processor';
import { FileOperationModule } from '@app/file-operation/file-operation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity]),
    BullModule.registerQueue({
      name: 'file-delete-queue',
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
    FileOperationModule,
  ],
  controllers: [FileController],
  providers: [FileService, FileDeleteQueueProcessor],
  exports: [FileService],
})
export class FileModule {}
