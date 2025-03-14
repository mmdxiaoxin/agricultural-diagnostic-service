import { Dataset, File } from '@app/database/entities';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { formatResponse } from '@shared/helpers/response.helper';
import { In, Repository } from 'typeorm';
import { CreateDatasetDto } from '../../../../../packages/common/src/dto/dataset/create-dataset.dto';
import { UpdateDatasetDto } from '../../../../../packages/common/src/dto/dataset/update-dataset.dto';

@Injectable()
export class DatasetService {
  constructor(
    @InjectRepository(Dataset)
    private datasetRepository: Repository<Dataset>,

    @InjectRepository(File)
    private fileRepository: Repository<File>,
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

    queryBuilder.where('dataset.createdBy = :userId', { userId });

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
    const list = datasets.map((dataset) => {
      const fileCount = dataset.files?.length; // 文件的数量
      // 计算 datasetSize
      const datasetSize = dataset.files?.reduce((totalSize, file) => {
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

    return {
      success: true,
      result: {
        list,
        total,
        page,
        pageSize,
      },
    };
  }

  async createDataset(userId: number, dto: CreateDatasetDto) {
    const { fileIds, ...datasetData } = dto;
    const dataset = this.datasetRepository.create({
      ...datasetData,
      createdBy: userId,
      updatedBy: userId,
    });
    if (fileIds && fileIds?.length > 0) {
      dataset.files = await this.fileRepository.find({
        where: { id: In(fileIds) },
      });
    }
    await this.datasetRepository.save(dataset);
    return {
      success: true,
      result: dataset,
    };
  }

  async getDatasetDetail(datasetId: number) {
    const dataset = await this.datasetRepository.findOne({
      where: { id: datasetId },
      relations: ['files'],
    });
    if (!dataset) {
      throw new RpcException('未发现该数据集');
    }
    const result = {
      ...dataset,
      fileIds: dataset.files?.map((file) => file.id),
      files: undefined, // 不返回 files 字段
    };
    return {
      success: true,
      result,
    };
  }

  async updateDataset(
    datasetId: number,
    userId: number,
    dto: UpdateDatasetDto,
  ) {
    const dataset = await this.datasetRepository.findOne({
      where: { id: datasetId },
      relations: ['files'],
    });
    if (!dataset) {
      return formatResponse(404, null, '未发现该数据集');
    }
    const { fileIds, ...datasetData } = dto;
    dataset.name = datasetData.name || dataset.name;
    dataset.description = datasetData.description || dataset.description;
    dataset.updatedBy = userId;
    if (fileIds && fileIds?.length > 0) {
      dataset.files = await this.fileRepository.find({
        where: { id: In(fileIds) },
      });
    }
    await this.datasetRepository.save(dataset);
    return {
      success: true,
      result: dataset,
    };
  }

  async deleteDataset(datasetId: number, userId: number) {
    const dataset = await this.datasetRepository.findOne({
      where: { id: datasetId },
      relations: ['files'],
    });
    if (!dataset) {
      throw new RpcException('未发现该数据集');
    }
    if (dataset.createdBy !== userId) {
      throw new RpcException('无权限删除该数据集');
    }
    await this.datasetRepository.remove(dataset);
    return {
      success: true,
      result: null,
    };
  }
}
