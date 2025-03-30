import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiagnosisRule, Disease } from '@app/database/entities';
import { CreateDiagnosisRuleDto } from '@common/dto/knowledge/create-diagnosisRule.dto';
import { formatResponse } from '@shared/helpers/response.helper';
import { RpcException } from '@nestjs/microservices';
import { UpdateDiagnosisRuleDto } from '@common/dto/knowledge/update-diagnosisRule.dto';

@Injectable()
export class DiagnosisRuleService {
  constructor(
    @InjectRepository(DiagnosisRule)
    private diagnosisRuleRepository: Repository<DiagnosisRule>,
    @InjectRepository(Disease)
    private diseaseRepository: Repository<Disease>,
  ) {}

  // 创建诊断规则
  async create(dto: CreateDiagnosisRuleDto) {
    const disease = await this.diseaseRepository.findOne({
      where: { id: dto.diseaseId },
    });
    if (!disease) {
      throw new RpcException({
        code: 404,
        message: `Disease with ID ${dto.diseaseId} not found`,
      });
    }
    const rule = this.diagnosisRuleRepository.create({ ...dto, disease });
    await this.diagnosisRuleRepository.save(rule);
    return formatResponse(201, rule, '诊断规则创建成功');
  }

  // 获取所有诊断规则
  async findAll() {
    const rules = await this.diagnosisRuleRepository.find({
      relations: ['disease'],
    });
    return formatResponse(200, rules, '诊断规则列表获取成功');
  }

  async findList(page: number, pageSize: number) {
    const [rules, total] = await this.diagnosisRuleRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return formatResponse(
      200,
      { list: rules, total, page, pageSize },
      '诊断规则列表获取成功',
    );
  }

  // 根据ID获取诊断规则
  async findById(id: number) {
    const rule = await this.diagnosisRuleRepository.findOne({
      where: { id },
      relations: ['disease'],
    });
    if (!rule) {
      throw new RpcException({
        code: 404,
        message: `DiagnosisRule with ID ${id} not found`,
      });
    }
    return formatResponse(200, rule, '诊断规则获取成功');
  }

  // 更新诊断规则
  async update(id: number, dto: UpdateDiagnosisRuleDto) {
    const rule = await this.diagnosisRuleRepository.findOne({
      where: { id },
      relations: ['disease'],
    });
    if (!rule) {
      throw new RpcException({
        code: 404,
        message: `DiagnosisRule with ID ${id} not found`,
      });
    }
    Object.assign(rule, dto);
    await this.diagnosisRuleRepository.save(rule);
    return formatResponse(200, rule, '诊断规则更新成功');
  }

  // 删除诊断规则
  async remove(id: number) {
    const rule = await this.diagnosisRuleRepository.findOne({
      where: { id },
    });
    if (!rule) {
      throw new RpcException({
        code: 404,
        message: `DiagnosisRule with ID ${id} not found`,
      });
    }
    await this.diagnosisRuleRepository.remove(rule);
    return formatResponse(200, null, '诊断规则删除成功');
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

    const result = matchedRules.map((rule) => ({
      disease: rule.disease,
      probability: rule.probability,
      recommendedAction: rule.recommendedAction,
    }));
    return formatResponse(200, result, '诊断规则匹配成功');
  }
}
