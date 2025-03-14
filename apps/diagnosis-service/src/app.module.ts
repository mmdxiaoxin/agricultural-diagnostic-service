import { DatabaseModule } from '@app/database';
import { Module } from '@nestjs/common';
import { DiagnosisModule } from './modules/diagnosis/diagnosis.module';

@Module({
  imports: [DiagnosisModule, DatabaseModule.register()],
})
export class AppModule {}
