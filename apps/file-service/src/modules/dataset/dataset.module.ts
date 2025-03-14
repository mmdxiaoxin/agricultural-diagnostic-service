import { Dataset, File } from '@app/database/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatasetController } from './dataset.controller';
import { DatasetService } from './dataset.service';

@Module({
  imports: [TypeOrmModule.forFeature([Dataset, File])],
  providers: [DatasetService],
  controllers: [DatasetController],
})
export class DatasetModule {}
