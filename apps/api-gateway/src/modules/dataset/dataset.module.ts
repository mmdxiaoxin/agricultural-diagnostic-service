import { Dataset } from '@app/database/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileModule } from '../file/file.module';
import { DatasetController } from './dataset.controller';
import { DatasetManageService } from './service/dataset-manage.service';
import { DatasetService } from './service/dataset.service';

@Module({
  imports: [TypeOrmModule.forFeature([Dataset]), FileModule],
  providers: [DatasetService, DatasetManageService],
  controllers: [DatasetController],
})
export class DatasetModule {}
