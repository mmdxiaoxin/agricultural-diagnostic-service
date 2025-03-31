import { Disease, Treatment } from '@app/database/entities';
import { CreateTreatmentDto } from '@common/dto/knowledge/create-treatment.dto';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';
import { UpdateTreatmentDto } from '@common/dto/knowledge/update-treatment.dto';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { formatResponse } from '@shared/helpers/response.helper';
import { Like, Repository } from 'typeorm';

@Injectable()
export class TreatmentService {
  constructor(
    @InjectRepository(Treatment)
    private treatmentRepository: Repository<Treatment>,
    @InjectRepository(Disease) private diseaseRepository: Repository<Disease>,
  ) {}

  // 创建治疗方案
  async create(dto: CreateTreatmentDto) {
    const disease = await this.diseaseRepository.findOne({
      where: { id: dto.diseaseId },
    });
    if (!disease) {
      throw new RpcException({
        code: 404,
        message: `Disease with ID ${dto.diseaseId} not found`,
      });
    }
    const treatment = this.treatmentRepository.create({ ...dto, disease });
    await this.treatmentRepository.save(treatment);
    return formatResponse(201, treatment, '治疗方案创建成功');
  }

  // 获取所有治疗方案
  async findAll() {
    const treatments = await this.treatmentRepository.find({
      relations: ['disease'],
    });
    return formatResponse(200, treatments, '治疗方案列表获取成功');
  }

  async findList(query: PageQueryKeywordsDto) {
    const { page = 1, pageSize = 10, keyword = '' } = query;
    const [treatments, total] = await this.treatmentRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where: [
        { method: Like(`%${keyword}%`) },
        { recommendedProducts: Like(`%${keyword}%`) },
      ],
      relations: ['disease'],
    });
    return formatResponse(
      200,
      { list: treatments, total, page, pageSize },
      '治疗方案列表获取成功',
    );
  }

  // 根据ID获取治疗方案
  async findById(id: number) {
    const treatment = await this.treatmentRepository.findOne({
      where: { id },
      relations: ['disease'],
    });
    if (!treatment) {
      throw new RpcException({
        code: 404,
        message: `Treatment with ID ${id} not found`,
      });
    }
    return formatResponse(200, treatment, '治疗方案获取成功');
  }

  // 更新治疗方案
  async update(id: number, dto: UpdateTreatmentDto) {
    const treatment = await this.treatmentRepository.findOne({
      where: { id },
    });
    if (!treatment) {
      throw new RpcException({
        code: 404,
        message: `Treatment with ID ${id} not found`,
      });
    }
    Object.assign(treatment, dto);
    return formatResponse(200, treatment, '治疗方案更新成功');
  }

  // 删除治疗方案
  async remove(id: number) {
    const treatment = await this.treatmentRepository.findOne({
      where: { id },
    });
    if (!treatment) {
      throw new RpcException({
        code: 404,
        message: `Treatment with ID ${id} not found`,
      });
    }
    await this.treatmentRepository.remove(treatment);
    return formatResponse(204, null, '治疗方案删除成功');
  }
}
