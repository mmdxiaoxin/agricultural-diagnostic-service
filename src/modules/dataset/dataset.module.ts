import { Module } from '@nestjs/common';
import { DatasetService } from './dataset.service';
import { DatasetController } from './dataset.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dataset } from './dataset.entity';
import { FileModule } from '../file/file.module';

@Module({
  imports: [TypeOrmModule.forFeature([Dataset]), FileModule],
  providers: [DatasetService],
  controllers: [DatasetController],
})
export class DatasetModule {}
