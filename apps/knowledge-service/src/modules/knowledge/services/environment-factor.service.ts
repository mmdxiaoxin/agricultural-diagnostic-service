import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnvironmentFactor } from '@app/database/entities';
import { EnvironmentFactorDto } from '@common/dto/knowledge/environment-factor.dto';
import { DiseaseService } from './disease.service';

@Injectable()
export class EnvironmentFactorService {
  constructor(
    @InjectRepository(EnvironmentFactor)
    private environmentFactorRepository: Repository<EnvironmentFactor>,
    private diseaseService: DiseaseService,
  ) {}

  // 创建环境因素
  async create(dto: EnvironmentFactorDto) {
    const disease = await this.diseaseService.findById(dto.diseaseId);
    if (!disease) {
      throw new NotFoundException(`Disease with ID ${dto.diseaseId} not found`);
    }
    const factor = this.environmentFactorRepository.create({ ...dto, disease });
    return await this.environmentFactorRepository.save(factor);
  }

  // 获取所有环境因素
  async findAll() {
    return await this.environmentFactorRepository.find({
      relations: ['disease'],
    });
  }

  // 根据ID获取环境因素
  async findById(id: number) {
    return await this.environmentFactorRepository.findOne({
      where: { id },
      relations: ['disease'],
    });
  }
}
