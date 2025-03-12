import { Module } from '@nestjs/common';
import { DiagnosisModule } from './modules/diagnosis/diagnosis.module';
import { DatabaseModule } from '@app/database';

@Module({
  imports: [DiagnosisModule, DatabaseModule.register()],
})
export class AppModule {}
