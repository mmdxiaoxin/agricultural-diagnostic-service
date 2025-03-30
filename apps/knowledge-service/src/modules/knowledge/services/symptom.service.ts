import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Symptom } from '@app/database/entities';
import { SymptomDto } from '@common/dto/knowledge/symptom.dto';
import { DiseaseService } from './disease.service';

@Injectable()
export class SymptomService {
  constructor(
    @InjectRepository(Symptom) private symptomRepository: Repository<Symptom>,
    private diseaseService: DiseaseService,
  ) {}

  // 创建症状
  async create(dto: SymptomDto) {
    const disease = await this.diseaseService.findById(dto.diseaseId);
    if (!disease) {
      throw new NotFoundException(`Disease with ID ${dto.diseaseId} not found`);
    }
    const symptom = this.symptomRepository.create({ ...dto, disease });
    return await this.symptomRepository.save(symptom);
  }

  // 获取所有症状
  async findAll() {
    return await this.symptomRepository.find({
      relations: ['disease'],
    });
  }

  // 根据ID获取症状
  async findById(id: number) {
    const symptom = await this.symptomRepository.findOne({
      where: { id },
      relations: ['disease'],
    });
    if (!symptom) {
      throw new NotFoundException(`Symptom with ID ${id} not found`);
    }
    return symptom;
  }

  // 更新症状
  async update(id: number, dto: SymptomDto) {
    const symptom = await this.findById(id);
    Object.assign(symptom, dto);
    return await this.symptomRepository.save(symptom);
  }

  // 删除症状
  async remove(id: number) {
    const symptom = await this.findById(id);
    await this.symptomRepository.remove(symptom);
    return { deleted: true };
  }
}
