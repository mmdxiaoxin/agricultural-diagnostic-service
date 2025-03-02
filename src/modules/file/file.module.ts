import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { File } from './models/file.entity';
import { Task } from './models/task.entity';
import { FileOperationService } from './operation.service';

@Module({
  imports: [TypeOrmModule.forFeature([File, Task])],
  providers: [FileService, FileOperationService],
  controllers: [FileController],
  exports: [FileService],
})
export class FileModule {}
