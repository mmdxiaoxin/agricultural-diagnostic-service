import { Crop, Disease } from '@app/database/entities';
import { CreateDiseaseDto } from '@common/dto/knowledge/create-disease.dto';
import { UpdateKnowledgeDto } from '@common/dto/knowledge/update-knowledge.dto';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { formatResponse } from '@shared/helpers/response.helper';
import { Repository } from 'typeorm';

@Injectable()
export class DiseaseService {
  constructor(
    @InjectRepository(Disease) private diseaseRepository: Repository<Disease>,
    @InjectRepository(Crop) private cropRepository: Repository<Crop>,
  ) {}

  // 创建病害
  async create(dto: CreateDiseaseDto) {
    const crop = await this.cropRepository.findOne({
      where: { id: dto.cropId },
    });
    if (!crop) {
      throw new RpcException({
        code: 404,
        message: `Crop with ID ${dto.cropId} not found`,
      });
    }
    const disease = this.diseaseRepository.create({ ...dto, crop });
    await this.diseaseRepository.save(disease);
    return formatResponse(201, disease, '病害创建成功');
  }

  // 获取所有病害
  async findAll() {
    const diseases = await this.diseaseRepository.find({
      relations: [
        'crop',
        'symptoms',
        'treatments',
        'environmentFactors',
        'diagnosisRules',
      ],
    });
    return formatResponse(200, diseases, '病害列表获取成功');
  }

  async findList(page: number, pageSize: number) {
    const [diseases, total] = await this.diseaseRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      relations: [
        'crop',
        'symptoms',
        'treatments',
        'environmentFactors',
        'diagnosisRules',
      ],
    });
    return formatResponse(
      200,
      { list: diseases, total, page, pageSize },
      '病害列表获取成功',
    );
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
      throw new RpcException({
        code: 404,
        message: `Disease with ID ${id} not found`,
      });
    }
    return formatResponse(200, disease, '病害详情获取成功');
  }

  // 更新病害信息
  async update(id: number, dto: UpdateKnowledgeDto) {
    const disease = await this.diseaseRepository.findOne({ where: { id } });
    if (!disease) {
      throw new RpcException({
        code: 404,
        message: `Disease with ID ${id} not found`,
      });
    }
    Object.assign(disease, dto);
    await this.diseaseRepository.save(disease);
    return formatResponse(200, disease, '病害更新成功');
  }

  // 删除病害
  async remove(id: number) {
    const disease = await this.diseaseRepository.findOne({ where: { id } });
    if (!disease) {
      throw new RpcException({
        code: 404,
        message: `Disease with ID ${id} not found`,
      });
    }
    await this.diseaseRepository.remove(disease);
    return formatResponse(204, null, '病害删除成功');
  }
}
