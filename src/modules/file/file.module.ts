import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileController } from './file.controller';
import { File } from './models/file.entity';
import { FileService } from './file.service';
import { Task } from './models/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([File, Task])],
  providers: [FileService],
  controllers: [FileController],
  exports: [FileService],
})
export class FileModule {}
