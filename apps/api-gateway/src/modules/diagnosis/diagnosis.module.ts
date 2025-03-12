import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileModule } from '../file/file.module';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisHistory } from '../../../../../libs/database/src/entities/diagnosis-history.entity';
import { DiagnosisService } from './diagnosis.service';
import { AIModel } from '../../../../../libs/database/src/entities/ai-model.entity';
import { Plant } from '../../../../../libs/database/src/entities/plant.entity';

@Module({
  imports: [
    FileModule,
    TypeOrmModule.forFeature([DiagnosisHistory, AIModel, Plant]),
  ],
  providers: [DiagnosisService],
  controllers: [DiagnosisController],
})
export class DiagnosisModule {}
