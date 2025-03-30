import { Module } from '@nestjs/common';
import { SymptomService } from './symptom.service';
import { SymptomController } from './symptom.controller';

@Module({
  controllers: [SymptomController],
  providers: [SymptomService],
})
export class SymptomModule {}
