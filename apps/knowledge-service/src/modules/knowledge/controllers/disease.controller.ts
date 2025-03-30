import { DiseaseDto } from '@common/dto/knowledge/disease.dto';
import { UpdateKnowledgeDto } from '@common/dto/knowledge/update-knowledge.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DiseaseService } from '../services/disease.service';

@Controller()
export class DiseaseController {
  constructor(private readonly diseaseService: DiseaseService) {}

  // 病害相关接口
  @MessagePattern({ cmd: 'disease.create' })
  async createDisease(@Payload() payload: { dto: DiseaseDto }) {
    return this.diseaseService.create(payload.dto);
  }

  @MessagePattern({ cmd: 'disease.findAll' })
  async findAllDiseases() {
    return this.diseaseService.findAll();
  }

  @MessagePattern({ cmd: 'disease.findById' })
  async findDiseaseById(@Payload() payload: { id: number }) {
    return this.diseaseService.findById(payload.id);
  }

  @MessagePattern({ cmd: 'disease.update' })
  async updateDisease(
    @Payload() payload: { id: number; dto: UpdateKnowledgeDto },
  ) {
    return this.diseaseService.update(payload.id, payload.dto);
  }

  @MessagePattern({ cmd: 'disease.delete' })
  async removeDisease(@Payload() payload: { id: number }) {
    return this.diseaseService.remove(payload.id);
  }
}
