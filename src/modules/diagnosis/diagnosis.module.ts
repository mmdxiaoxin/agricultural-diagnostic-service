import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagnosisController } from './diagnosis.controller';
import { AiServiceAccessLog } from './models/ai-service-access-log';
import { AiServiceConfig } from './models/ai-service-config';
import { AiServiceLog } from './models/ai-service-log';
import { AiService } from './models/ai-service.entity';
import { DiagnosisHistory } from './models/diagnosis-history.entity';
import { AiManageService } from './services/ai-manage.service';
import { DiagnosisService } from './services/diagnosis.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DiagnosisHistory,
      AiService,
      AiServiceConfig,
      AiServiceLog,
      AiServiceAccessLog,
    ]),
  ],
  providers: [DiagnosisService, AiManageService],
  controllers: [DiagnosisController],
})
export class DiagnosisModule {}
