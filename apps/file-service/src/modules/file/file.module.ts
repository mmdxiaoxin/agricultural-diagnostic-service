import { FileEntity } from '@app/database/entities';
import { FileOperationService } from '@app/file-operation/file-operation.service';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity]),
    BullModule.registerQueue({
      name: 'file-delete',
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
  ],
  controllers: [FileController],
  providers: [FileService, FileOperationService],
  exports: [FileService],
})
export class FileModule {}
