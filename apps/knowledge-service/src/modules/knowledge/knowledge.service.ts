import {
  Crop,
  DiagnosisRule,
  Disease,
  EnvironmentFactor,
  Symptom,
  Treatment,
} from '@app/database/entities';
import { CropDto } from '@common/dto/knowledge/crop.dto';
import { DiagnosisRuleDto } from '@common/dto/knowledge/diagnosis-rule.dto';
import { DiseaseDto } from '@common/dto/knowledge/disease.dto';
import { EnvironmentFactorDto } from '@common/dto/knowledge/environment-factor.dto';
import { SymptomDto } from '@common/dto/knowledge/symptom.dto';
import { TreatmentDto } from '@common/dto/knowledge/treatment.dto';
import { UpdateKnowledgeDto } from '@common/dto/knowledge/update-knowledge.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(Crop) private cropRepository: Repository<Crop>,
    @InjectRepository(Disease) private diseaseRepository: Repository<Disease>,
    @InjectRepository(Symptom) private symptomRepository: Repository<Symptom>,
    @InjectRepository(Treatment)
    private treatmentRepository: Repository<Treatment>,
    @InjectRepository(EnvironmentFactor)
    private environmentFactorRepository: Repository<EnvironmentFactor>,
    @InjectRepository(DiagnosisRule)
    private diagnosisRuleRepository: Repository<DiagnosisRule>,
  ) {}

  // 创建作物
  async createCrop(dto: CropDto) {
    const crop = this.cropRepository.create(dto);
    return await this.cropRepository.save(crop);
  }

  // 创建病害
  async createDisease(dto: DiseaseDto) {
    const crop = await this.cropRepository.findOne({
      where: { id: dto.cropId },
    });
    if (!crop) {
      throw new NotFoundException(`Crop with ID ${dto.cropId} not found`);
    }
    const disease = this.diseaseRepository.create({ ...dto, crop });
    return await this.diseaseRepository.save(disease);
  }

  // 创建症状
  async createSymptom(dto: SymptomDto) {
    const disease = await this.diseaseRepository.findOne({
      where: { id: dto.diseaseId },
    });
    if (!disease) {
      throw new NotFoundException(`Disease with ID ${dto.diseaseId} not found`);
    }
    const symptom = this.symptomRepository.create({ ...dto, disease });
    return await this.symptomRepository.save(symptom);
  }

  // 创建治疗方案
  async createTreatment(dto: TreatmentDto) {
    const disease = await this.diseaseRepository.findOne({
      where: { id: dto.diseaseId },
    });
    if (!disease) {
      throw new NotFoundException(`Disease with ID ${dto.diseaseId} not found`);
    }
    const treatment = this.treatmentRepository.create({ ...dto, disease });
    return await this.treatmentRepository.save(treatment);
  }

  // 创建环境因素
  async createEnvironmentFactor(dto: EnvironmentFactorDto) {
    const disease = await this.diseaseRepository.findOne({
      where: { id: dto.diseaseId },
    });
    if (!disease) {
      throw new NotFoundException(`Disease with ID ${dto.diseaseId} not found`);
    }
    const factor = this.environmentFactorRepository.create({ ...dto, disease });
    return await this.environmentFactorRepository.save(factor);
  }

  // 创建诊断规则
  async createDiagnosisRule(dto: DiagnosisRuleDto) {
    const disease = await this.diseaseRepository.findOne({
      where: { id: dto.diseaseId },
    });
    if (!disease) {
      throw new NotFoundException(`Disease with ID ${dto.diseaseId} not found`);
    }
    const rule = this.diagnosisRuleRepository.create({ ...dto, disease });
    return await this.diagnosisRuleRepository.save(rule);
  }

  // 获取所有作物
  async findAllCrops() {
    return await this.cropRepository.find();
  }

  // 获取所有病害
  async findAllDiseases() {
    return await this.diseaseRepository.find({
      relations: [
        'crop',
        'symptoms',
        'treatments',
        'environmentFactors',
        'diagnosisRules',
      ],
    });
  }

  // 获取单个病害详情
  async findDiseaseById(id: number) {
    const disease = await this.diseaseRepository.findOne({
      where: { id },
      relations: [
        'crop',
        'symptoms',
        'treatments',
        'environmentFactors',
        'diagnosisRules',
      ],
    });
    if (!disease) {
      throw new NotFoundException(`Disease with ID ${id} not found`);
    }
    return disease;
  }

  // 更新病害信息
  async updateDisease(id: number, dto: UpdateKnowledgeDto) {
    const disease = await this.diseaseRepository.findOne({ where: { id } });
    if (!disease) {
      throw new NotFoundException(`Disease with ID ${id} not found`);
    }
    Object.assign(disease, dto);
    return await this.diseaseRepository.save(disease);
  }

  // 删除病害及其相关数据
  async removeDisease(id: number) {
    return await this.executeInTransaction(async (manager) => {
      const disease = await manager.findOne(Disease, { where: { id } });
      if (!disease) {
        throw new NotFoundException(`Disease with ID ${id} not found`);
      }

      // 删除相关的症状
      await manager.delete(Symptom, { disease: { id } });
      // 删除相关的治疗方案
      await manager.delete(Treatment, { disease: { id } });
      // 删除相关的环境因素
      await manager.delete(EnvironmentFactor, { disease: { id } });
      // 删除相关的诊断规则
      await manager.delete(DiagnosisRule, { disease: { id } });
      // 删除病害本身
      await manager.remove(disease);

      return { deleted: true };
    });
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

  // 事务处理
  private async executeInTransaction<T>(
    operation: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return await this.diseaseRepository.manager.connection.transaction(
      async (manager) => {
        return await operation(manager);
      },
    );
  }
}
