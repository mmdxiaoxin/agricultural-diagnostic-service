import { Crop } from '@app/database/entities';
import { CreateCropDto } from '@common/dto/knowledge/create-crop.dto';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';
import { UpdateCropDto } from '@common/dto/knowledge/update-crop.dto';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { formatResponse } from '@shared/helpers/response.helper';
import { Like, Repository } from 'typeorm';

@Injectable()
export class CropService {
  constructor(
    @InjectRepository(Crop) private cropRepository: Repository<Crop>,
  ) {}

  // 创建作物
  async create(dto: CreateCropDto) {
    const crop = this.cropRepository.create(dto);
    await this.cropRepository.save(crop);
    return formatResponse(201, crop, '作物创建成功');
  }

  // 获取所有作物
  async findAll() {
    const crops = await this.cropRepository.find();
    return formatResponse(200, crops, '作物列表获取成功');
  }

  async findList(query: PageQueryKeywordsDto) {
    const { page = 1, pageSize = 10, keyword = '' } = query;
    const [crops, total] = await this.cropRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where: [
        { name: Like(`%${keyword}%`) },
        { scientificName: Like(`%${keyword}%`) },
        { growthStage: Like(`%${keyword}%`) },
      ],
    });
    return formatResponse(
      200,
      { list: crops, total, page, pageSize },
      '作物列表获取成功',
    );
  }

  // 根据ID获取作物
  async findById(id: number) {
    const crop = await this.cropRepository.findOne({ where: { id } });
    if (!crop) {
      throw new RpcException({
        code: 404,
        message: `Crop with ID ${id} not found`,
      });
    }
    return formatResponse(200, crop, '作物获取成功');
  }

  // 更新作物
  async update(id: number, dto: UpdateCropDto) {
    const crop = await this.cropRepository.findOne({ where: { id } });
    if (!crop) {
      throw new RpcException({
        code: 404,
        message: `Crop with ID ${id} not found`,
      });
    }
    Object.assign(crop, dto);
    await this.cropRepository.save(crop);
    return formatResponse(200, crop, '作物更新成功');
  }

  // 删除作物
  async remove(id: number) {
    const crop = await this.cropRepository.findOne({ where: { id } });
    if (!crop) {
      throw new RpcException({
        code: 404,
        message: `Crop with ID ${id} not found`,
      });
    }
    await this.cropRepository.remove(crop);
    return formatResponse(204, null, '作物删除成功');
  }
}
