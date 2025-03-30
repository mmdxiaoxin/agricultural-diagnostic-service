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

  @MessagePattern({ cmd: 'treatment.findAll' })
  async findAllTreatments() {
    return this.treatmentService.findAll();
  }

  @MessagePattern({ cmd: 'treatment.findById' })
  async findTreatmentById(@Payload() payload: { id: number }) {
    return this.treatmentService.findById(payload.id);
  }

  @MessagePattern({ cmd: 'treatment.update' })
  async updateTreatment(@Payload() payload: { id: number; dto: TreatmentDto }) {
    return this.treatmentService.update(payload.id, payload.dto);
  }

  @MessagePattern({ cmd: 'treatment.delete' })
  async removeTreatment(@Payload() payload: { id: number }) {
    return this.treatmentService.remove(payload.id);
  }
}
