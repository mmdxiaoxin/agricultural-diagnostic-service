import { formatResponse } from '@/common/helpers/response.helper';
import { FileService } from '@/modules/file/services/file.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dataset } from '../dataset.entity';
import { CreateDatasetDto } from '../dto/create-dataset.dto';
import { UpdateDatasetDto } from '../dto/update-dataset.dto';

@Injectable()
export class DatasetManageService {
  constructor(
    @InjectRepository(Dataset)
    private datasetRepository: Repository<Dataset>,
    private fileService: FileService,
  ) {}

  async datasetsListGet(
    page: number,
    pageSize: number,
    userId: number,
    filters?: {
      name?: string;
      createdStart?: string;
      createdEnd?: string;
      updatedStart?: string;
      updatedEnd?: string;
    },
  ) {
    const query = this.datasetRepository.createQueryBuilder('dataset');
    query.where('dataset.createdBy = :userId', { userId });

    if (filters?.name) {
      query.andWhere('dataset.name like :name', {
        name: `%${filters.name}%`,
      });
    }

    if (filters?.createdStart) {
      query.andWhere('dataset.created_at >= :createdStart', {
        createdStart: new Date(filters.createdStart),
      });
    }

    if (filters?.createdEnd) {
      query.andWhere('dataset.created_at <= :createdEnd', {
        createdEnd: new Date(filters.createdEnd),
      });
    }

    if (filters?.updatedStart) {
      query.andWhere('dataset.updated_at >= :updatedStart', {
        updatedStart: new Date(filters.updatedStart),
      });
    }

    if (filters?.updatedEnd) {
      query.andWhere('dataset.updated_at <= :updatedEnd', {
        updatedEnd: new Date(filters.updatedEnd),
      });
    }

    const [list, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return formatResponse(
      200,
      { list, page, pageSize, total },
      '获取数据集列表成功',
    );
  }

  async createDataset(userId: number, dto: CreateDatasetDto) {
    const { fileIds, ...datasetData } = dto;
    const dataset = this.datasetRepository.create({
      ...datasetData,
      createdBy: userId,
      updatedBy: userId,
    });
    if (fileIds && fileIds?.length > 0) {
      dataset.files = await this.fileService.findByIds(fileIds);
    }
    await this.datasetRepository.save(dataset);
    return formatResponse(200, dataset, '创建数据集成功');
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
