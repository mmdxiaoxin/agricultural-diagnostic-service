import {
  Crop,
  DiagnosisRule,
  Disease,
  EnvironmentFactor,
  Symptom,
  Treatment,
} from '@app/database/entities';
import { CreateKnowledgeDto } from '@common/dto/knowledge/create-knowledge.dto';
import { UpdateKnowledgeDto } from '@common/dto/knowledge/update-knowledge.dto';
import { Injectable } from '@nestjs/common';
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

  // 创建病害知识记录
  async knowledgeCreate(dto: CreateKnowledgeDto) {
    return await this.executeInTransaction(async (manager) => {
      const crop = manager.create(Crop, dto.crop);
      const disease = manager.create(Disease, { ...dto.disease, crop });
      const symptom = manager.create(Symptom, { ...dto.symptom, disease });
      const treatment = manager.create(Treatment, {
        ...dto.treatment,
        disease,
      });
      const environmentFactor = manager.create(EnvironmentFactor, {
        ...dto.environmentFactor,
        disease,
      });
      const diagnosisRule = manager.create(DiagnosisRule, {
        ...dto.diagnosisRule,
        disease,
      });

      await manager.save(crop);
      await manager.save(disease);
      await manager.save(symptom);
      await manager.save(treatment);
      await manager.save(environmentFactor);
      await manager.save(diagnosisRule);

      return disease; // 返回创建的病害记录
    });
  }

  // 获取所有病害知识记录
  async knowledgeGet() {
    return await this.diseaseRepository.find({ relations: ['crop'] });
  }

  // 获取单个病害知识记录
  async knowledgeGetById(id: number) {
    return await this.diseaseRepository.findOne({
      where: { id },
      relations: ['crop'],
    });
  }

  // 更新病害知识记录
  async knowledgeUpdate(id: number, dto: UpdateKnowledgeDto) {
    return await this.executeInTransaction(async (manager) => {
      const disease = await manager.findOne(Disease, { where: { id } });
      if (!disease) throw new Error('Disease not found');

      // 更新病害信息
      Object.assign(disease, dto);
      await manager.save(disease);
      return disease;
    });
  }

  // 删除病害知识记录
  async knowledgeRemove(id: number) {
    return await this.executeInTransaction(async (manager) => {
      const disease = await manager.findOne(Disease, { where: { id } });
      if (!disease) throw new Error('Disease not found');

      await manager.remove(disease);
      return { deleted: true };
    });
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
