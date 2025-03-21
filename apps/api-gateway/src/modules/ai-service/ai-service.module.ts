import { Module } from '@nestjs/common';
import { AiServiceService } from './ai-service.service';
import { AiServiceController } from './ai-service.controller';

@Module({
  controllers: [AiServiceController],
  providers: [AiServiceService],
})
export class AiServiceModule {}
