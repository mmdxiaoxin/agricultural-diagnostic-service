import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePlantDiseaseKnowledgeDto } from './dto/create-knowledge.dto';
import { UpdatePlantDiseaseKnowledgeDto } from './dto/update-knowledge.dto';
import { PlantDiseaseKnowledge } from './knowledge.entity';
import { formatResponse } from '@/common/helpers/response.helper';

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(PlantDiseaseKnowledge)
    private readonly knowledgeRepository: Repository<PlantDiseaseKnowledge>,
  ) {}

  // 创建病害知识记录
  async create(dto: CreatePlantDiseaseKnowledgeDto) {
    const knowledge = this.knowledgeRepository.create(dto);
    return this.knowledgeRepository.save(knowledge);
  }

  // 获取所有病害知识记录
  findAll() {
    return this.knowledgeRepository.find();
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
    return await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
  }

  async knowledgeGet() {
    return await this.knowledgeRepository.find();
  }

  // 获取单个病害知识记录
  async findById(id: number) {
    const knowledge = await this.knowledgeRepository.findOne({ where: { id } });
    if (!knowledge) {
      throw new NotFoundException('病害知识记录不存在');
    }
    return knowledge;
  }

  // 更新病害知识记录
  async update(id: number, dto: UpdatePlantDiseaseKnowledgeDto) {
    const knowledge = await this.knowledgeRepository.findOne({ where: { id } });
    if (!knowledge) {
      return null;
    }
    const updatedKnowledge = this.knowledgeRepository.merge(knowledge, dto);
    return this.knowledgeRepository.save(updatedKnowledge);
  }

  // 删除病害知识记录
  remove(id: number) {
    return this.knowledgeRepository.delete(id);
  }
}
