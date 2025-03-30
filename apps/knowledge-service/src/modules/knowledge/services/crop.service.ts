import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Crop } from '@app/database/entities';
import { CropDto } from '@common/dto/knowledge/crop.dto';

@Injectable()
export class CropService {
  constructor(
    @InjectRepository(Crop) private cropRepository: Repository<Crop>,
  ) {}

  // 创建作物
  async create(dto: CropDto) {
    const crop = this.cropRepository.create(dto);
    return await this.cropRepository.save(crop);
  }

  // 获取所有作物
  async findAll() {
    return await this.cropRepository.find();
  }

  // 根据ID获取作物
  async findById(id: number) {
    const crop = await this.cropRepository.findOne({ where: { id } });
    if (!crop) {
      throw new NotFoundException(`Crop with ID ${id} not found`);
    }
    return crop;
  }

  // 更新作物
  async update(id: number, dto: CropDto) {
    const crop = await this.findById(id);
    Object.assign(crop, dto);
    return await this.cropRepository.save(crop);
  }

  // 删除作物
  async remove(id: number) {
    const crop = await this.findById(id);
    await this.cropRepository.remove(crop);
    return { deleted: true };
  }
}
