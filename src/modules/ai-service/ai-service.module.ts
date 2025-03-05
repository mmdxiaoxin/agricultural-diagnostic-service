import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiServiceController } from './ai-service.controller';
import { AiServiceAccessLog } from './models/ai-service-access-log.entity';
import { AiServiceConfig } from './models/ai-service-config.entity';
import { AiServiceLog } from './models/ai-service-log.entity';
import { AiService } from './models/ai-service.entity';
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
  providers: [AiServiceService],
  controllers: [AiServiceController],
})
export class AiServiceModule {}
