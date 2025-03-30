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
}
