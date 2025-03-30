import { TreatmentDto } from '@common/dto/knowledge/treatment.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TreatmentService } from '../services/treatment.service';

@Controller()
export class TreatmentController {
  constructor(private readonly treatmentService: TreatmentService) {}

  // 治疗方案相关接口
  @MessagePattern({ cmd: 'treatment.create' })
  async createTreatment(@Payload() payload: { dto: TreatmentDto }) {
    return this.treatmentService.create(payload.dto);
  }
}
