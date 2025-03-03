import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePlantDiseaseKnowledgeDto } from '../dto/create-knowledge.dto';
import { UpdatePlantDiseaseKnowledgeDto } from '../dto/update-knowledge.dto';
import { PlantDiseaseKnowledge } from '../knowledge.entity';

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(PlantDiseaseKnowledge)
    private readonly knowledgeRepository: Repository<PlantDiseaseKnowledge>,
  ) {}

  // 创建病害知识记录
  create(dto: CreatePlantDiseaseKnowledgeDto) {
    const knowledge = this.knowledgeRepository.create(dto);
    return this.knowledgeRepository.save(knowledge);
  }

  // 获取所有病害知识记录
  findAll() {
    return this.knowledgeRepository.find();
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
