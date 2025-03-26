import { DatabaseModule } from '@app/database';
import { AiService, AiServiceConfig } from '@app/database/entities';
import { Module } from '@nestjs/common';
import { AiServiceController } from './ai-service.controller';
import { AiConfigsService } from './services/ai-service-config.service';
import { AiServiceService } from './services/ai-service.service';

@Module({
  imports: [DatabaseModule.forFeature([AiService, AiServiceConfig])],
  providers: [AiServiceService, AiConfigsService],
  controllers: [AiServiceController],
})
export class AiServiceModule {}
