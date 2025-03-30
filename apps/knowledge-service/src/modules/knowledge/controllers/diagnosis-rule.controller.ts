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

  @MessagePattern({ cmd: 'diagnosisRule.findAll' })
  async findAllDiagnosisRules() {
    return this.diagnosisRuleService.findAll();
  }

  @MessagePattern({ cmd: 'diagnosisRule.findById' })
  async findDiagnosisRuleById(@Payload() payload: { id: number }) {
    return this.diagnosisRuleService.findById(payload.id);
  }

  @MessagePattern({ cmd: 'diagnosisRule.update' })
  async updateDiagnosisRule(
    @Payload() payload: { id: number; dto: DiagnosisRuleDto },
  ) {
    return this.diagnosisRuleService.update(payload.id, payload.dto);
  }

  @MessagePattern({ cmd: 'diagnosisRule.delete' })
  async removeDiagnosisRule(@Payload() payload: { id: number }) {
    return this.diagnosisRuleService.remove(payload.id);
  }

  // 诊断相关接口
  @MessagePattern({ cmd: 'disease.diagnose' })
  async diagnoseDisease(@Payload() payload: { symptomIds: string[] }) {
    return this.diagnosisRuleService.diagnoseDisease(payload.symptomIds);
  }
}
