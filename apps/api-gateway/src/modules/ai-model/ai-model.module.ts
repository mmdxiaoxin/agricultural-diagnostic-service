import { Module } from '@nestjs/common';
import { AiModelService } from './ai-model.service';
import { AiModelController } from './ai-model.controller';

@Module({
  controllers: [AiModelController],
  providers: [AiModelService],
})
export class AiModelModule {}
