import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Disease } from '@app/database/entities';
import { DiseaseDto } from '@common/dto/knowledge/disease.dto';
import { UpdateKnowledgeDto } from '@common/dto/knowledge/update-knowledge.dto';
import { CropService } from './crop.service';

@Injectable()
export class DiseaseService {
  constructor(
    @InjectRepository(Disease) private diseaseRepository: Repository<Disease>,
    private cropService: CropService,
  ) {}

  // 创建病害
  async create(dto: DiseaseDto) {
    const crop = await this.cropService.findById(dto.cropId);
    if (!crop) {
      throw new NotFoundException(`Crop with ID ${dto.cropId} not found`);
    }
    const disease = this.diseaseRepository.create({ ...dto, crop });
    return await this.diseaseRepository.save(disease);
  }

  // 获取所有病害
  async findAll() {
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
  async findById(id: number) {
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
  async update(id: number, dto: UpdateKnowledgeDto) {
    const disease = await this.diseaseRepository.findOne({ where: { id } });
    if (!disease) {
      throw new NotFoundException(`Disease with ID ${id} not found`);
    }
    Object.assign(disease, dto);
    return await this.diseaseRepository.save(disease);
  }

  // 删除病害
  async remove(id: number) {
    const disease = await this.diseaseRepository.findOne({ where: { id } });
    if (!disease) {
      throw new NotFoundException(`Disease with ID ${id} not found`);
    }
    await this.diseaseRepository.remove(disease);
    return { deleted: true };
  }
}
