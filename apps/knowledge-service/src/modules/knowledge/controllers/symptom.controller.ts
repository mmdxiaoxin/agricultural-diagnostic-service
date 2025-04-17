import { CreateSymptomDto } from '@common/dto/knowledge/create-symptom.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SymptomService } from '../services/symptom.service';
import { UpdateSymptomDto } from '@common/dto/knowledge/update-symptom.dto';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';

@Controller()
export class SymptomController {
  constructor(private readonly symptomService: SymptomService) {}

  // 症状相关接口
  @MessagePattern({ cmd: 'symptom.create' })
  async createSymptom(@Payload() payload: { dto: CreateSymptomDto }) {
    return this.symptomService.create(payload.dto);
  }

  @MessagePattern({ cmd: 'symptom.get' })
  async findAllSymptoms() {
    return this.symptomService.findAll();
  }

  @MessagePattern({ cmd: 'symptom.get.list' })
  async findList(@Payload() payload: { query: PageQueryKeywordsDto }) {
    return this.symptomService.findList(payload.query);
  }

  @MessagePattern({ cmd: 'symptom.get.byId' })
  async findSymptomById(@Payload() payload: { id: number }) {
    return this.symptomService.findById(payload.id);
  }

  @MessagePattern({ cmd: 'symptom.image.get' })
  async findImage(@Payload() payload: { id: number }) {
    return this.symptomService.findImage(payload.id);
  }

  @MessagePattern({ cmd: 'symptom.update' })
  async updateSymptom(
    @Payload() payload: { id: number; dto: UpdateSymptomDto },
  ) {
    return this.symptomService.update(payload.id, payload.dto);
  }

  @MessagePattern({ cmd: 'symptom.delete' })
  async removeSymptom(@Payload() payload: { id: number }) {
    return this.symptomService.remove(payload.id);
  }
}
