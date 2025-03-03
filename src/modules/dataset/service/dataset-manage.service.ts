import { formatResponse } from '@/common/helpers/response.helper';
import { FileService } from '@/modules/file/services/file.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dataset } from '../dataset.entity';
import { CreateDatasetDto } from '../dto/create-dataset.dto';
import { UpdateDatasetDto } from '../dto/update-dataset.dto';
import { DatasetService } from './dataset.service';

@Injectable()
export class DatasetManageService {
  constructor(
    @InjectRepository(Dataset)
    private datasetRepository: Repository<Dataset>,
    private fileService: FileService,
    private datasetService: DatasetService,
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
    const queryBuilder = this.datasetRepository.createQueryBuilder('dataset');

    // 添加过滤条件
    if (filters?.name) {
      queryBuilder.andWhere('dataset.name LIKE :name', {
        name: `%${filters.name}%`,
      });
    }
    if (filters?.createdStart) {
      queryBuilder.andWhere('dataset.createdAt >= :createdStart', {
        createdStart: filters.createdStart,
      });
    }
    if (filters?.createdEnd) {
      queryBuilder.andWhere('dataset.createdAt <= :createdEnd', {
        createdEnd: filters.createdEnd,
      });
    }
    if (filters?.updatedStart) {
      queryBuilder.andWhere('dataset.updatedAt >= :updatedStart', {
        updatedStart: filters.updatedStart,
      });
    }
    if (filters?.updatedEnd) {
      queryBuilder.andWhere('dataset.updatedAt <= :updatedEnd', {
        updatedEnd: filters.updatedEnd,
      });
    }

    // 使用 LEFT JOIN 加载 File 实体
    queryBuilder.leftJoinAndSelect('dataset.files', 'file');

    // 设置分页
    queryBuilder.skip((page - 1) * pageSize).take(pageSize);

    // 执行查询，获取数据和总数
    const [datasets, total] = await queryBuilder.getManyAndCount();

    // 计算 datasetSize 和 fileCount
    const result = datasets.map((dataset) => {
      const fileCount = dataset.files.length; // 文件的数量
      // 计算 datasetSize
      const datasetSize = dataset.files.reduce((totalSize, file) => {
        const size = file.fileSize ? Number(file.fileSize) : 0;
        return totalSize + size;
      }, 0);

      return {
        ...dataset,
        fileCount,
        datasetSize,
        files: undefined, // 不返回 files 字段
      };
    });

    return formatResponse(
      200,
      {
        list: result,
        total,
        page,
        pageSize,
      },
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
    const dataset = await this.datasetService.findById(datasetId);
    const result = {
      ...dataset,
      fileIds: dataset.files.map((file) => file.id),
      files: undefined, // 不返回 files 字段
    };
    return formatResponse(200, result, '获取数据集详情成功');
  }

  async updateDataset(
    datasetId: number,
    userId: number,
    dto: UpdateDatasetDto,
  ) {
    const dataset = await this.datasetService.findById(datasetId);
    const { fileIds, ...datasetData } = dto;
    dataset.name = datasetData.name || dataset.name;
    dataset.description = datasetData.description || dataset.description;
    dataset.updatedBy = userId;
    if (fileIds && fileIds?.length > 0) {
      dataset.files = await this.fileService.findByIds(fileIds);
    }
    await this.datasetRepository.save(dataset);
    return formatResponse(200, dataset, '更新数据集成功');
  }

  async deleteDataset(datasetId: number, userId: number): Promise<void> {
    const dataset = await this.datasetService.findById(datasetId);
    if (dataset.createdBy !== userId) {
      throw new Error('无权限删除该数据集');
    }
    await this.datasetRepository.remove(dataset);
  }
}
