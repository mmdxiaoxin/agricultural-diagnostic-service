import { CreateTreatmentDto } from '@common/dto/knowledge/create-treatment.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TreatmentService } from '../services/treatment.service';
import { UpdateTreatmentDto } from '@common/dto/knowledge/update-treatment.dto';

@Controller()
export class TreatmentController {
  constructor(private readonly treatmentService: TreatmentService) {}

  // 治疗方案相关接口
  @MessagePattern({ cmd: 'treatment.create' })
  async createTreatment(@Payload() payload: { dto: CreateTreatmentDto }) {
    return this.treatmentService.create(payload.dto);
  }

  @MessagePattern({ cmd: 'treatment.get' })
  async findAllTreatments() {
    return this.treatmentService.findAll();
  }

  @MessagePattern({ cmd: 'treatment.get.list' })
  async findList(@Payload() payload: { page: number; pageSize: number }) {
    return this.treatmentService.findList(payload.page, payload.pageSize);
  }

  @MessagePattern({ cmd: 'treatment.get.byId' })
  async findTreatmentById(@Payload() payload: { id: number }) {
    return this.treatmentService.findById(payload.id);
  }

  @MessagePattern({ cmd: 'treatment.update' })
  async updateTreatment(
    @Payload() payload: { id: number; dto: UpdateTreatmentDto },
  ) {
    return this.treatmentService.update(payload.id, payload.dto);
  }

  @MessagePattern({ cmd: 'treatment.delete' })
  async removeTreatment(@Payload() payload: { id: number }) {
    return this.treatmentService.remove(payload.id);
  }
}
