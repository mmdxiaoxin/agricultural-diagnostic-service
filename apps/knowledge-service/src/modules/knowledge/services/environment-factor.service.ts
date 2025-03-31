import { Disease, EnvironmentFactor } from '@app/database/entities';
import { CreateEnvironmentFactorDto } from '@common/dto/knowledge/create-environmentFactor.dto';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';
import { UpdateEnvironmentFactorDto } from '@common/dto/knowledge/update-environmentFactor.dto';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { formatResponse } from '@shared/helpers/response.helper';
import { Like, Repository } from 'typeorm';

@Injectable()
export class EnvironmentFactorService {
  constructor(
    @InjectRepository(EnvironmentFactor)
    private environmentFactorRepository: Repository<EnvironmentFactor>,
    @InjectRepository(Disease)
    private diseaseRepository: Repository<Disease>,
  ) {}

  // 创建环境因素
  async create(dto: CreateEnvironmentFactorDto) {
    const disease = await this.diseaseRepository.findOne({
      where: { id: dto.diseaseId },
    });
    if (!disease) {
      throw new RpcException({
        code: 404,
        message: `Disease with ID ${dto.diseaseId} not found`,
      });
    }
    const factor = this.environmentFactorRepository.create({ ...dto, disease });
    return await this.environmentFactorRepository.save(factor);
  }

  // 获取所有环境因素
  async findAll() {
    const factors = await this.environmentFactorRepository.find({
      relations: ['disease'],
    });
    return formatResponse(200, factors, '环境因素列表获取成功');
  }

  async findList(query: PageQueryKeywordsDto) {
    const { page = 1, pageSize = 10, keyword = '' } = query;
    const [factors, total] =
      await this.environmentFactorRepository.findAndCount({
        skip: (page - 1) * pageSize,
        take: pageSize,
        relations: ['disease'],
        where: [{ factor: Like(`%${keyword}%`) }],
      });
    return formatResponse(
      200,
      { list: factors, total, page, pageSize },
      '环境因素列表获取成功',
    );
  }

  // 根据ID获取环境因素
  async findById(id: number) {
    const factor = await this.environmentFactorRepository.findOne({
      where: { id },
      relations: ['disease'],
    });
    if (!factor) {
      throw new RpcException({
        code: 404,
        message: `EnvironmentFactor with ID ${id} not found`,
      });
    }
    return formatResponse(200, factor, '环境因素获取成功');
  }

  // 更新环境因素
  async update(id: number, dto: UpdateEnvironmentFactorDto) {
    const factor = await this.environmentFactorRepository.findOne({
      where: { id },
    });
    if (!factor) {
      throw new RpcException({
        code: 404,
        message: `EnvironmentFactor with ID ${id} not found`,
      });
    }
    Object.assign(factor, dto);
    return formatResponse(200, factor, '环境因素更新成功');
  }

  // 删除环境因素
  async remove(id: number) {
    const factor = await this.environmentFactorRepository.findOne({
      where: { id },
    });
    if (!factor) {
      throw new RpcException({
        code: 404,
        message: `EnvironmentFactor with ID ${id} not found`,
      });
    }
    await this.environmentFactorRepository.remove(factor);
    return formatResponse(204, null, '环境因素删除成功');
  }
}
