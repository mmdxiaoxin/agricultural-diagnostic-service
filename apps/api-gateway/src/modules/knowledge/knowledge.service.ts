import { PlantDiseaseKnowledge } from '@app/database/entities';
import { CreatePlantDiseaseKnowledgeDto } from '@common/dto/knowledge/create-knowledge.dto';
import { UpdatePlantDiseaseKnowledgeDto } from '@common/dto/knowledge/update-knowledge.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { formatResponse } from '@shared/helpers/response.helper';
import { Repository } from 'typeorm';

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(PlantDiseaseKnowledge)
    private readonly knowledgeRepository: Repository<PlantDiseaseKnowledge>,
  ) {}

  // 创建病害知识记录
  async create(dto: CreatePlantDiseaseKnowledgeDto) {
    const knowledge = this.knowledgeRepository.create(dto);
    await this.knowledgeRepository.save(knowledge);
    return formatResponse(201, null, '病害知识记录创建成功');
  }

  // 获取所有病害知识记录
  async knowledgeListGet(
    page: number = 1,
    pageSize: number = 10,
    filters: {
      category?: string;
    },
  ) {
    const queryBuilder = this.knowledgeRepository.createQueryBuilder(
      'plant_disease_knowledge',
    );
    if (filters.category) {
      queryBuilder.where('knowledge.category = :category', {
        category: filters.category,
      });
    }
    const [list, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return formatResponse(
      200,
      {
        list,
        page,
        pageSize,
        total,
      },
      '病害知识列表获取成功',
    );
  }

  async knowledgeGet() {
    const knowledge = await this.knowledgeRepository.find();
    return formatResponse(200, knowledge, '病害知识记录获取成功');
  }

  // 获取单个病害知识记录
  async knowledgeGetById(id: number) {
    const knowledge = await this.knowledgeRepository.findOne({ where: { id } });
    if (!knowledge) {
      throw new NotFoundException('病害知识记录不存在');
    }
    return formatResponse(200, knowledge, '病害知识记录获取成功');
  }

  // 更新病害知识记录
  async knowledgeUpdate(id: number, dto: UpdatePlantDiseaseKnowledgeDto) {
    const knowledge = await this.knowledgeRepository.findOne({ where: { id } });
    if (!knowledge) {
      return null;
    }
    const updatedKnowledge = this.knowledgeRepository.merge(knowledge, dto);
    await this.knowledgeRepository.save(updatedKnowledge);
    return formatResponse(200, null, '病害知识记录更新成功');
  }

  // 删除病害知识记录
  async knowledgeRemove(id: number) {
    return this.knowledgeRepository.delete(id);
  }
}
