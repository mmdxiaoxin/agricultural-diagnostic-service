import { Dataset, FileEntity } from '@app/database/entities';
import { CreateDatasetDto } from '@common/dto/dataset/create-dataset.dto';
import { UpdateDatasetAccessDto } from '@common/dto/dataset/update-dataset-access.dto';
import { UpdateDatasetDto } from '@common/dto/dataset/update-dataset.dto';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { formatResponse } from '@shared/helpers/response.helper';
import { In, Repository } from 'typeorm';
@Injectable()
export class DatasetService {
  constructor(
    @InjectRepository(Dataset)
    private datasetRepository: Repository<Dataset>,
    @InjectRepository(FileEntity)
    private fileRepository: Repository<FileEntity>,
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
        fileIds: dataset.files?.map((file) => file.id),
      };
    });

    return formatResponse(
      200,
      {
        list,
        total,
        page,
        pageSize,
      },
      '获取数据集列表成功',
    );
  }

  async publicDatasetsListGet(
    page: number,
    pageSize: number,
    filters?: {
      name?: string;
      createdStart?: string;
      createdEnd?: string;
      updatedStart?: string;
      updatedEnd?: string;
    },
  ) {
    const queryBuilder = this.datasetRepository.createQueryBuilder('dataset');

    // 只获取公开的数据集
    queryBuilder.where('dataset.access = :access', { access: 'public' });

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
        fileIds: dataset.files?.map((file) => file.id),
      };
    });

    return formatResponse(
      200,
      {
        list,
        total,
        page,
        pageSize,
      },
      '获取公开数据集列表成功',
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
      dataset.files = await this.fileRepository.find({
        where: { id: In(fileIds) },
      });
    }
    await this.datasetRepository.save(dataset);
    return formatResponse(201, dataset, '成功创建数据集');
  }

  async copyDataset(datasetId: number, userId: number) {
    // 使用事务来确保数据一致性
    return await this.datasetRepository.manager.transaction(async (manager) => {
      // 获取原始数据集
      const originalDataset = await manager.findOne(Dataset, {
        where: { id: datasetId },
        relations: ['files'],
      });

      if (!originalDataset) {
        throw new RpcException({
          code: 404,
          message: '未发现该数据集',
        });
      }

      if (!originalDataset.files) {
        throw new RpcException({
          code: 400,
          message: '数据集没有关联的文件',
        });
      }

      // 复制文件元数据
      const newFiles = await Promise.all(
        originalDataset.files.map(async (file) => {
          const newFile = manager.create(FileEntity, {
            originalFileName: file.originalFileName,
            storageFileName: file.storageFileName,
            filePath: file.filePath,
            fileSize: file.fileSize,
            fileType: file.fileType,
            fileMd5: file.fileMd5,
            access: file.access,
            createdBy: userId,
            updatedBy: userId,
            version: 1,
          });
          return await manager.save(newFile);
        }),
      );

      // 创建新的数据集
      const newDataset = manager.create(Dataset, {
        name: `${originalDataset.name} (副本)`,
        description: originalDataset.description,
        access: originalDataset.access,
        createdBy: userId,
        updatedBy: userId,
        files: newFiles, // 使用新复制的文件
      });

      // 保存新数据集
      await manager.save(newDataset);

      return formatResponse(201, newDataset, '成功复制数据集');
    });
  }

  async getDatasetDetail(datasetId: number) {
    const dataset = await this.datasetRepository.findOne({
      where: { id: datasetId },
      relations: ['files'],
    });
    if (!dataset) {
      throw new RpcException({
        code: 404,
        message: '未发现该数据集',
      });
    }
    const result = {
      ...dataset,
      fileIds: dataset.files?.map((file) => file.id),
    };
    return formatResponse(200, result, '获取数据集详情成功');
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
    return formatResponse(200, dataset, '更新数据集成功');
  }

  async updateDatasetAccess(
    datasetId: number,
    userId: number,
    dto: UpdateDatasetAccessDto,
  ) {
    const dataset = await this.datasetRepository.findOne({
      where: { id: datasetId },
    });
    if (!dataset) {
      return formatResponse(404, null, '未发现该数据集');
    }
    if (dataset.createdBy !== userId) {
      return formatResponse(403, null, '无权限更新数据集权限');
    }
    dataset.access = dto.access;
    await this.datasetRepository.save(dataset);
    return formatResponse(200, dataset, '更新数据集权限成功');
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
    return formatResponse(204, null, '删除数据集成功');
  }
}
