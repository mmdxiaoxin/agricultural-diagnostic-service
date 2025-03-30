import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Disease, Symptom } from '@app/database/entities';
import { CreateSymptomDto } from '@common/dto/knowledge/create-symptom.dto';
import { formatResponse } from '@shared/helpers/response.helper';
import { RpcException } from '@nestjs/microservices';
import { UpdateSymptomDto } from '@common/dto/knowledge/update-symptom.dto';

@Injectable()
export class SymptomService {
  constructor(
    @InjectRepository(Symptom) private symptomRepository: Repository<Symptom>,
    @InjectRepository(Disease) private diseaseRepository: Repository<Disease>,
  ) {}

  // 创建症状
  async create(dto: CreateSymptomDto) {
    const disease = await this.diseaseRepository.findOne({
      where: { id: dto.diseaseId },
    });
    if (!disease) {
      throw new RpcException({
        code: 404,
        message: `Disease with ID ${dto.diseaseId} not found`,
      });
    }
    const symptom = this.symptomRepository.create({ ...dto, disease });
    await this.symptomRepository.save(symptom);
    return formatResponse(201, symptom, '症状创建成功');
  }

  // 获取所有症状
  async findAll() {
    const symptoms = await this.symptomRepository.find({
      relations: ['disease'],
    });
    return formatResponse(200, symptoms, '症状列表获取成功');
  }

  async findList(page: number, pageSize: number) {
    const [symptoms, total] = await this.symptomRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      relations: ['disease'],
    });
    return formatResponse(
      200,
      { list: symptoms, total, page, pageSize },
      '症状列表获取成功',
    );
  }

  // 根据ID获取症状
  async findById(id: number) {
    const symptom = await this.symptomRepository.findOne({
      where: { id },
      relations: ['disease'],
    });
    if (!symptom) {
      throw new RpcException({
        code: 404,
        message: `Symptom with ID ${id} not found`,
      });
    }
    return formatResponse(200, symptom, '症状获取成功');
  }

  // 更新症状
  async update(id: number, dto: UpdateSymptomDto) {
    const symptom = await this.symptomRepository.findOne({
      where: { id },
    });
    if (!symptom) {
      throw new RpcException({
        code: 404,
        message: `Symptom with ID ${id} not found`,
      });
    }
    Object.assign(symptom, dto);
    return formatResponse(200, symptom, '症状更新成功');
  }

  // 删除症状
  async remove(id: number) {
    const symptom = await this.symptomRepository.findOne({
      where: { id },
    });
    if (!symptom) {
      throw new RpcException({
        code: 404,
        message: `Symptom with ID ${id} not found`,
      });
    }
    await this.symptomRepository.remove(symptom);
    return formatResponse(204, null, '症状删除成功');
  }
}
