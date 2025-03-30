import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Treatment } from '@app/database/entities';
import { TreatmentDto } from '@common/dto/knowledge/treatment.dto';
import { DiseaseService } from './disease.service';

@Injectable()
export class TreatmentService {
  constructor(
    @InjectRepository(Treatment)
    private treatmentRepository: Repository<Treatment>,
    private diseaseService: DiseaseService,
  ) {}

  // 创建治疗方案
  async create(dto: TreatmentDto) {
    const disease = await this.diseaseService.findById(dto.diseaseId);
    if (!disease) {
      throw new NotFoundException(`Disease with ID ${dto.diseaseId} not found`);
    }
    const treatment = this.treatmentRepository.create({ ...dto, disease });
    return await this.treatmentRepository.save(treatment);
  }

  // 获取所有治疗方案
  async findAll() {
    return await this.treatmentRepository.find({
      relations: ['disease'],
    });
  }

  // 根据ID获取治疗方案
  async findById(id: number) {
    const treatment = await this.treatmentRepository.findOne({
      where: { id },
      relations: ['disease'],
    });
    if (!treatment) {
      throw new NotFoundException(`Treatment with ID ${id} not found`);
    }
    return treatment;
  }

  // 更新治疗方案
  async update(id: number, dto: TreatmentDto) {
    const treatment = await this.findById(id);
    Object.assign(treatment, dto);
    return await this.treatmentRepository.save(treatment);
  }

  // 删除治疗方案
  async remove(id: number) {
    const treatment = await this.findById(id);
    await this.treatmentRepository.remove(treatment);
    return { deleted: true };
  }
}
