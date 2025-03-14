import {
  AIModel,
  Dataset,
  DiagnosisHistory,
  File,
  Plant,
} from '@app/database/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileModule } from '../file/file.module';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisService } from './diagnosis.service';

@Module({
  imports: [
    FileModule,
    TypeOrmModule.forFeature([DiagnosisHistory, AIModel, Plant, File, Dataset]),
  ],
  providers: [DiagnosisService],
  controllers: [DiagnosisController],
})
export class DiagnosisModule {}
