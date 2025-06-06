import { CreateDiagnosisRuleDto } from '@common/dto/knowledge/create-diagnosisRule.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DiagnosisRuleService } from '../services/diagnosis-rule.service';
import { UpdateDiagnosisRuleDto } from '@common/dto/knowledge/update-diagnosisRule.dto';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';

@Controller()
export class DiagnosisRuleController {
  constructor(private readonly diagnosisRuleService: DiagnosisRuleService) {}

  // 诊断规则相关接口
  @MessagePattern({ cmd: 'diagnosisRule.create' })
  async createDiagnosisRule(
    @Payload() payload: { dto: CreateDiagnosisRuleDto },
  ) {
    return this.diagnosisRuleService.create(payload.dto);
  }

  @MessagePattern({ cmd: 'diagnosisRule.get' })
  async findAllDiagnosisRules() {
    return this.diagnosisRuleService.findAll();
  }

  @MessagePattern({ cmd: 'diagnosisRule.get.list' })
  async findList(@Payload() payload: { query: PageQueryKeywordsDto }) {
    return this.diagnosisRuleService.findList(payload.query);
  }

  @MessagePattern({ cmd: 'diagnosisRule.get.byId' })
  async findDiagnosisRuleById(@Payload() payload: { id: number }) {
    return this.diagnosisRuleService.findById(payload.id);
  }

  @MessagePattern({ cmd: 'diagnosisRule.update' })
  async updateDiagnosisRule(
    @Payload() payload: { id: number; dto: UpdateDiagnosisRuleDto },
  ) {
    return this.diagnosisRuleService.update(payload.id, payload.dto);
  }

  @MessagePattern({ cmd: 'diagnosisRule.delete' })
  async removeDiagnosisRule(@Payload() payload: { id: number }) {
    return this.diagnosisRuleService.remove(payload.id);
  }
}
