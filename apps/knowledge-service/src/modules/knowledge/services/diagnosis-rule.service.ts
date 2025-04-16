import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { DiagnosisRule, Disease } from '@app/database/entities';
import { CreateDiagnosisRuleDto } from '@common/dto/knowledge/create-diagnosisRule.dto';
import { formatResponse } from '@shared/helpers/response.helper';
import { RpcException } from '@nestjs/microservices';
import { UpdateDiagnosisRuleDto } from '@common/dto/knowledge/update-diagnosisRule.dto';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';

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

  async findList(query: PageQueryKeywordsDto) {
    const { page = 1, pageSize = 10, keyword = '' } = query;
    const [rules, total] = await this.diagnosisRuleRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where: [{ schema: Like(`%${keyword}%`) }],
      relations: ['disease'],
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
        message: `诊断规则不存在`,
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
        message: `诊断规则不存在`,
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
        message: `诊断规则不存在`,
      });
    }
    await this.diagnosisRuleRepository.remove(rule);
    return formatResponse(200, null, '诊断规则删除成功');
  }
}
