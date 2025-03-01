import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Dataset } from './dataset.entity';
import { CreateDatasetDto } from './dto/create-dataset.dto';
import { UpdateDatasetDto } from './dto/update-dataset.dto';

@Injectable()
export class DatasetService {
  constructor(
    @InjectRepository(Dataset)
    private datasetRepository: Repository<Dataset>,
  ) {}

  async getDatasetsList(): Promise<Dataset[]> {
    return this.datasetRepository.find();
  }

  async createDataset(createDatasetDto: CreateDatasetDto): Promise<Dataset> {
    const dataset = this.datasetRepository.create(createDatasetDto);
    return this.datasetRepository.save(dataset);
  }

  async getDatasetDetail(datasetId: number) {
    return this.datasetRepository.findOne({ where: { id: datasetId } });
  }

  async updateDataset(datasetId: number, updateDatasetDto: UpdateDatasetDto) {
    await this.datasetRepository.update(datasetId, updateDatasetDto);
    return this.getDatasetDetail(datasetId);
  }

  async deleteDataset(datasetId: number): Promise<void> {
    await this.datasetRepository.delete(datasetId);
  }
}
