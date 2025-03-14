import { FileOperationModule } from '@app/file-operation';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIModel } from '@app/database/entities/ai-model.entity';
import { Plant } from '@app/database/entities/plant.entity';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisService } from './diagnosis.service';
import { DatabaseModule } from '@app/database';
import { DiagnosisHistory } from '@app/database/entities';

@Module({
  imports: [
    FileOperationModule,
    DatabaseModule.forFeature([DiagnosisHistory, AIModel, Plant]),
  ],
  providers: [DiagnosisService],
  controllers: [DiagnosisController],
})
export class DiagnosisModule {}
