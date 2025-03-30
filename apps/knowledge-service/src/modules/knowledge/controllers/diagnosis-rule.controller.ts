import { DiagnosisRuleDto } from '@common/dto/knowledge/diagnosis-rule.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DiagnosisRuleService } from '../services/diagnosis-rule.service';

@Controller()
export class DiagnosisRuleController {
  constructor(private readonly diagnosisRuleService: DiagnosisRuleService) {}

  // 诊断规则相关接口
  @MessagePattern({ cmd: 'diagnosisRule.create' })
  async createDiagnosisRule(@Payload() payload: { dto: DiagnosisRuleDto }) {
    return this.diagnosisRuleService.create(payload.dto);
  }

  // 诊断相关接口
  @MessagePattern({ cmd: 'disease.diagnose' })
  async diagnoseDisease(@Payload() payload: { symptomIds: string[] }) {
    return this.diagnosisRuleService.diagnoseDisease(payload.symptomIds);
  }
}
