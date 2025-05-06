import { DatabaseModule } from '@app/database';
import { FileEntity } from '@app/database/entities';
import { FileOperationService } from '@app/file-operation/file-operation.service';
import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
  imports: [DatabaseModule.forFeature([FileEntity])],
  controllers: [FileController],
  providers: [FileService, FileOperationService],
  exports: [FileService],
})
export class FileModule {}
