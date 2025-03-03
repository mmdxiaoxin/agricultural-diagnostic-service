import { formatResponse } from '@/common/helpers/response.helper';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePlantDiseaseKnowledgeDto } from '../dto/create-knowledge.dto';
import { UpdatePlantDiseaseKnowledgeDto } from '../dto/update-knowledge.dto';
import { PlantDiseaseKnowledge } from '../knowledge.entity';
import { KnowledgeService } from './knowledge.service';

@Injectable()
export class KnowledgeManageService {
  constructor(
    @InjectRepository(PlantDiseaseKnowledge)
    private readonly knowledgeRepository: Repository<PlantDiseaseKnowledge>,
    private readonly knowledgeService: KnowledgeService,
  ) {}

  // 创建病害知识记录
  async knowledgeCreate(dto: CreatePlantDiseaseKnowledgeDto) {
    await this.knowledgeService.create(dto);
    return formatResponse(201, null, '病害知识创建成功');
  }

  // 获取所有病害知识记录
  async knowledgeListGet() {
    const list = await this.knowledgeRepository.find();
    return formatResponse(200, list, '病害知识列表获取成功');
  }

  // 获取单个病害知识记录
  async knowledgeDetailGet(id: number) {
    const knowledge = await this.knowledgeService.findById(id);
    return formatResponse(200, knowledge, '病害知识获取成功');
  }

  // 更新病害知识记录
  async knowledgeUpdate(id: number, updateDto: UpdatePlantDiseaseKnowledgeDto) {
    const knowledge = await this.knowledgeService.findById(id);
    Object.assign(knowledge, updateDto);
    await this.knowledgeRepository.save(knowledge);
    return formatResponse(200, null, '病害知识更新成功');
  }

  // 删除病害知识记录
  async knowledgeDelete(id: number) {
    await this.knowledgeRepository.delete(id);
  }
}
