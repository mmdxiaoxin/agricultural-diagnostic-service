import { Module } from '@nestjs/common';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisManageService } from './services/diagnosis-manage.service';
import { DiagnosisService } from './services/diagnosis.service';

@Module({
  providers: [DiagnosisService, DiagnosisManageService],
  controllers: [DiagnosisController],
})
export class DiagnosisModule {}
