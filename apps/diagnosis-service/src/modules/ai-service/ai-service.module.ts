import {
  AiService,
  AiServiceAccessLog,
  AiServiceConfig,
  AiServiceLog,
} from '@app/database/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiServiceController } from './ai-service.controller';
import { AiConfigsService } from './services/ai-service-config.service';
import { AiServiceService } from './services/ai-service.service';

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
