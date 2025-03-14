import { CreateDatasetDto } from '@common/dto/dataset/create-dataset.dto';
import { UpdateDatasetDto } from '@common/dto/dataset/update-dataset.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DatasetService } from './dataset.service';

@Controller()
export class DatasetController {
  constructor(private readonly manageService: DatasetService) {}

  // 获取数据集列表
  @MessagePattern({ cmd: 'dataset.get.list' })
  async datasetsListGet(@Payload() payload: any) {
    const {
      page = 1,
      pageSize = 10,
      name,
      createdStart,
      createdEnd,
      updatedStart,
      updatedEnd,
      userId,
    } = payload;
    return this.manageService.datasetsListGet(page, pageSize, userId, {
      name,
      createdStart,
      createdEnd,
      updatedStart,
      updatedEnd,
    });
  }

  // 创建数据集
  @MessagePattern({ cmd: 'dataset.create' })
  async createDataset(
    @Payload() payload: { userId: number; dto: CreateDatasetDto },
  ) {
    return this.manageService.createDataset(payload.userId, payload.dto);
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

  // 删除数据集
  @MessagePattern({ cmd: 'dataset.delete' })
  async deleteDataset(
    @Payload() payload: { datasetId: number; userId: number },
  ) {
    return this.manageService.deleteDataset(payload.datasetId, payload.userId);
  }
}
