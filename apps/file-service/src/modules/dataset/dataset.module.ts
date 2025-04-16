import { Dataset, FileEntity } from '@app/database/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatasetController } from './dataset.controller';
import { DatasetService } from './dataset.service';

@Module({
  imports: [TypeOrmModule.forFeature([Dataset, FileEntity])],
  providers: [DatasetService],
  controllers: [DatasetController],
})
export class DatasetModule {}
