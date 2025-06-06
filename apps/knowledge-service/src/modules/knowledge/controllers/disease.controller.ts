import { CreateDiseaseDto } from '@common/dto/knowledge/create-disease.dto';
import { UpdateKnowledgeDto } from '@common/dto/knowledge/update-knowledge.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DiseaseService } from '../services/disease.service';
import { PageQueryDateDto } from '@common/dto/page-query-date.dto';

@Controller()
export class DiseaseController {
  constructor(private readonly diseaseService: DiseaseService) {}

  // 病害相关接口
  @MessagePattern({ cmd: 'disease.create' })
  async createDisease(@Payload() payload: { dto: CreateDiseaseDto }) {
    return this.diseaseService.create(payload.dto);
  }

  @MessagePattern({ cmd: 'disease.get' })
  async findAllDiseases() {
    return this.diseaseService.findAll();
  }

  @MessagePattern({ cmd: 'disease.get.list' })
  async findList(@Payload() payload: { query: PageQueryDateDto }) {
    return this.diseaseService.findList(payload.query);
  }

  @MessagePattern({ cmd: 'disease.get.byId' })
  async findDiseaseById(@Payload() payload: { id: number }) {
    return this.diseaseService.findById(payload.id);
  }

  @MessagePattern({ cmd: 'disease.get.symptoms' })
  async findSymptoms(@Payload() payload: { id: number }) {
    return this.diseaseService.findSymptoms(payload.id);
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
