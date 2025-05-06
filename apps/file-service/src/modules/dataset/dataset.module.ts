import { DatabaseModule } from '@app/database';
import { Dataset, FileEntity } from '@app/database/entities';
import { Module } from '@nestjs/common';
import { DatasetController } from './dataset.controller';
import { DatasetService } from './dataset.service';

@Module({
  imports: [DatabaseModule.forFeature([Dataset, FileEntity])],
  providers: [DatasetService],
  controllers: [DatasetController],
})
export class DatasetModule {}
