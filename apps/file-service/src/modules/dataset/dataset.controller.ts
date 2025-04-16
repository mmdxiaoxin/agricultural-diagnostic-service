import { CreateDatasetDto } from '@common/dto/dataset/create-dataset.dto';
import { UpdateDatasetDto } from '@common/dto/dataset/update-dataset.dto';
import { DatasetQueryDto } from '@common/dto/diagnosis/dastaset-query.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DatasetService } from './dataset.service';
import { UpdateDatasetAccessDto } from '@common/dto/dataset/update-dataset-access.dto';

@Controller()
export class DatasetController {
  constructor(private readonly manageService: DatasetService) {}

  // 获取数据集列表
  @MessagePattern({ cmd: 'dataset.get.list' })
  async datasetsListGet(
    @Payload() payload: { query: DatasetQueryDto; userId: number },
  ) {
    const { query, userId } = payload;
    const { page = 1, pageSize = 10 } = query;
    return this.manageService.datasetsListGet(page, pageSize, userId, {
      name: query.name,
      createdStart: query.createdStart,
      createdEnd: query.createdEnd,
      updatedStart: query.updatedStart,
      updatedEnd: query.updatedEnd,
    });
  }

  // 获取公共数据集列表
  @MessagePattern({ cmd: 'dataset.get.public.list' })
  async publicDatasetsListGet(@Payload() payload: { query: DatasetQueryDto }) {
    const { query } = payload;
    const { page = 1, pageSize = 10 } = query;
    return this.manageService.publicDatasetsListGet(page, pageSize, {
      name: query.name,
      createdStart: query.createdStart,
      createdEnd: query.createdEnd,
      updatedStart: query.updatedStart,
      updatedEnd: query.updatedEnd,
    });
  }

  // 创建数据集
  @MessagePattern({ cmd: 'dataset.create' })
  async createDataset(
    @Payload() payload: { userId: number; dto: CreateDatasetDto },
  ) {
    return this.manageService.createDataset(payload.userId, payload.dto);
  }

  // 复制数据集
  @MessagePattern({ cmd: 'dataset.copy' })
  async copyDataset(@Payload() payload: { datasetId: number; userId: number }) {
    return this.manageService.copyDataset(payload.datasetId, payload.userId);
  }

  // 获取数据集详情
  @MessagePattern({ cmd: 'dataset.detail' })
  async getDatasetDetail(@Payload() payload: { datasetId: number }) {
    return this.manageService.getDatasetDetail(payload.datasetId);
  }

  // 更新数据集
  @MessagePattern({ cmd: 'dataset.update' })
  async updateDataset(
    @Payload()
    payload: {
      datasetId: number;
      userId: number;
      dto: UpdateDatasetDto;
    },
  ) {
    return this.manageService.updateDataset(
      payload.datasetId,
      payload.userId,
      payload.dto,
    );
  }

  // 更新数据集权限
  @MessagePattern({ cmd: 'dataset.update.access' })
  async updateDatasetAccess(
    @Payload()
    payload: {
      datasetId: number;
      userId: number;
      dto: UpdateDatasetAccessDto;
    },
  ) {
    return this.manageService.updateDatasetAccess(
      payload.datasetId,
      payload.userId,
      payload.dto,
    );
  }

  // 删除数据集
  @MessagePattern({ cmd: 'dataset.delete' })
  async deleteDataset(
    @Payload() payload: { datasetId: number; userId: number },
  ) {
    return this.manageService.deleteDataset(payload.datasetId, payload.userId);
  }
}
