import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiServiceController } from './ai-service.controller';
import { AiServiceAccessLog } from '../../../../../libs/database/src/entities/ai-service-access-log.entity';
import { AiServiceConfig } from '../../../../../libs/database/src/entities/ai-service-config.entity';
import { AiServiceLog } from '../../../../../libs/database/src/entities/ai-service-log.entity';
import { AiService } from '../../../../../libs/database/src/entities/ai-service.entity';
import { AiServiceService } from './services/ai-service.service';
import { AiConfigsService } from './services/ai-service-config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiService,
      AiServiceAccessLog,
      AiServiceConfig,
      AiServiceLog,
    ]),
  ],
  providers: [AiServiceService, AiConfigsService],
  controllers: [AiServiceController],
})
export class AiServiceModule {}
