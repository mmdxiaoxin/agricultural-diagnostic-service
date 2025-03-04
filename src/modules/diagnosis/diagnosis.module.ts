import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileModule } from '../file/file.module';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisHistory } from './models/diagnosis-history.entity';
import { AiManageService } from './services/ai-manage.service';
import { DiagnosisService } from './services/diagnosis.service';

@Module({
  imports: [FileModule, TypeOrmModule.forFeature([DiagnosisHistory])],
  providers: [DiagnosisService, AiManageService],
  controllers: [DiagnosisController],
})
export class DiagnosisModule {}
