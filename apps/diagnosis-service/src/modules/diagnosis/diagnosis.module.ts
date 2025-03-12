import { FileOperationModule } from '@app/file-operation';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIModel } from 'apps/api-gateway/src/modules/ai-model/models/ai-model.entity';
import { Plant } from 'apps/api-gateway/src/modules/plant/models/plant.entity';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisService } from './diagnosis.service';
import { DiagnosisHistory } from './models/diagnosis-history.entity';
import { DatabaseModule } from '@app/database';

@Module({
  imports: [
    FileOperationModule,
    DatabaseModule.forFeature([DiagnosisHistory, AIModel, Plant]),
  ],
  providers: [DiagnosisService],
  controllers: [DiagnosisController],
})
export class DiagnosisModule {}
