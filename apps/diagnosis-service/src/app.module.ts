import { Module } from '@nestjs/common';
import { DiagnosisModule } from './modules/diagnosis/diagnosis.module';

@Module({
  imports: [DiagnosisModule],
})
export class AppModule {}
