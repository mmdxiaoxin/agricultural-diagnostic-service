import { Module } from '@nestjs/common';
import { FileOperationService } from './file-operation.service';

@Module({
  providers: [FileOperationService],
  exports: [FileOperationService],
})
export class FileOperationModule {}
