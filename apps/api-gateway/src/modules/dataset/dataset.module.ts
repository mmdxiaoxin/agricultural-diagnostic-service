import { Module } from '@nestjs/common';
import { DatasetService } from './service/dataset.service';
import { DatasetController } from './dataset.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dataset } from './dataset.entity';
import { FileModule } from '../file/file.module';
import { DatasetManageService } from './service/dataset-manage.service';

@Module({
  imports: [TypeOrmModule.forFeature([Dataset]), FileModule],
  providers: [DatasetService, DatasetManageService],
  controllers: [DatasetController],
})
export class DatasetModule {}
