import { SymptomDto } from '@common/dto/knowledge/symptom.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SymptomService } from '../services/symptom.service';

@Controller()
export class SymptomController {
  constructor(private readonly symptomService: SymptomService) {}

  // 症状相关接口
  @MessagePattern({ cmd: 'symptom.create' })
  async createSymptom(@Payload() payload: { dto: SymptomDto }) {
    return this.symptomService.create(payload.dto);
  }

  @MessagePattern({ cmd: 'symptom.findAll' })
  async findAllSymptoms() {
    return this.symptomService.findAll();
  }

  @MessagePattern({ cmd: 'symptom.findById' })
  async findSymptomById(@Payload() payload: { id: number }) {
    return this.symptomService.findById(payload.id);
  }

  @MessagePattern({ cmd: 'symptom.update' })
  async updateSymptom(@Payload() payload: { id: number; dto: SymptomDto }) {
    return this.symptomService.update(payload.id, payload.dto);
  }

  @MessagePattern({ cmd: 'symptom.delete' })
  async removeSymptom(@Payload() payload: { id: number }) {
    return this.symptomService.remove(payload.id);
  }
}
