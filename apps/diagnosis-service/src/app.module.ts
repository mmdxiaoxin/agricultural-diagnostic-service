import { DatabaseModule } from '@app/database';
import { Module } from '@nestjs/common';
import { AiServiceModule } from './modules/ai-service/ai-service.module';
import { DiagnosisModule } from './modules/diagnosis/diagnosis.module';

@Module({
  imports: [DiagnosisModule, AiServiceModule, DatabaseModule.register()],
})
export class AppModule {}
