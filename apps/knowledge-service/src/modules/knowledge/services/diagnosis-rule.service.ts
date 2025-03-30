import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiagnosisRule } from '@app/database/entities';
import { DiagnosisRuleDto } from '@common/dto/knowledge/diagnosis-rule.dto';
import { DiseaseService } from './disease.service';

@Injectable()
export class DiagnosisRuleService {
  constructor(
    @InjectRepository(DiagnosisRule)
    private diagnosisRuleRepository: Repository<DiagnosisRule>,
    private diseaseService: DiseaseService,
  ) {}

  // 创建诊断规则
  async create(dto: DiagnosisRuleDto) {
    const disease = await this.diseaseService.findById(dto.diseaseId);
    if (!disease) {
      throw new NotFoundException(`Disease with ID ${dto.diseaseId} not found`);
    }
    const rule = this.diagnosisRuleRepository.create({ ...dto, disease });
    return await this.diagnosisRuleRepository.save(rule);
  }

  // 获取所有诊断规则
  async findAll() {
    return await this.diagnosisRuleRepository.find({
      relations: ['disease'],
    });
  }

  // 根据ID获取诊断规则
  async findById(id: number) {
    const rule = await this.diagnosisRuleRepository.findOne({
      where: { id },
      relations: ['disease'],
    });
    if (!rule) {
      throw new NotFoundException(`DiagnosisRule with ID ${id} not found`);
    }
    return rule;
  }

  // 更新诊断规则
  async update(id: number, dto: DiagnosisRuleDto) {
    const rule = await this.findById(id);
    Object.assign(rule, dto);
    return await this.diagnosisRuleRepository.save(rule);
  }

  // 删除诊断规则
  async remove(id: number) {
    const rule = await this.findById(id);
    await this.diagnosisRuleRepository.remove(rule);
    return { deleted: true };
  }

  // 根据症状诊断病害
  async diagnoseDisease(symptomIds: string[]) {
    const rules = await this.diagnosisRuleRepository.find({
      relations: ['disease'],
    });

    const matchedRules = rules.filter((rule) => {
      const ruleSymptomIds = rule.symptomIds.split(',').map(Number);
      return symptomIds.every((id) => ruleSymptomIds.includes(Number(id)));
    });

    // 按概率排序
    matchedRules.sort((a, b) => b.probability - a.probability);

    return matchedRules.map((rule) => ({
      disease: rule.disease,
      probability: rule.probability,
      recommendedAction: rule.recommendedAction,
    }));
  }
}
