import { DatabaseModule } from '@app/database';
import { Dataset, File } from '@app/database/entities';
import { FileOperationModule } from '@app/file-operation';
import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
  imports: [DatabaseModule.forFeature([File, Dataset]), FileOperationModule],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
