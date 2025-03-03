import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dataset } from '../dataset.entity';

@Injectable()
export class DatasetService {
  constructor(
    @InjectRepository(Dataset)
    private datasetRepository: Repository<Dataset>,
  ) {}

  async findById(id: number) {
    const dataset = await this.datasetRepository.findOne({
      where: { id },
      relations: ['files'],
    });
    if (!dataset) {
      throw new NotFoundException('未发现该数据集');
    }
    return dataset;
  }
}
