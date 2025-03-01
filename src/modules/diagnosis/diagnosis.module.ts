import { Module } from '@nestjs/common';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisService } from './diagnosis.service';

@Module({
  controllers: [DiagnosisController],
  providers: [DiagnosisService]
})
export class DiagnosisModule {}
