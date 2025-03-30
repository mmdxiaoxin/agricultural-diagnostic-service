import { Module } from '@nestjs/common';
import { TreatmentService } from './treatment.service';
import { TreatmentController } from './treatment.controller';

@Module({
  controllers: [TreatmentController],
  providers: [TreatmentService],
})
export class TreatmentModule {}
