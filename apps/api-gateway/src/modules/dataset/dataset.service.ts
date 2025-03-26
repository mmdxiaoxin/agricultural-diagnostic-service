import { CreateDatasetDto } from '@common/dto/dataset/create-dataset.dto';
import { UpdateDatasetDto } from '@common/dto/dataset/update-dataset.dto';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FILE_SERVICE_NAME } from 'config/microservice.config';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { formatResponse } from '@shared/helpers/response.helper';

@Injectable()
export class DatasetService {
  constructor(
    @Inject(FILE_SERVICE_NAME) private readonly fileClient: ClientProxy,
  ) {}

  async getDatasetList(params: {
    page: number;
    pageSize: number;
    name?: string;
    createdStart?: string;
    createdEnd?: string;
    updatedStart?: string;
    updatedEnd?: string;
    userId: number;
  }) {
    const response = await lastValueFrom(
      this.fileClient.send({ cmd: 'dataset.get.list' }, params),
    );
    return formatResponse(200, response?.result, '获取数据集列表成功');
  }

  async createDataset(userId: number, dto: CreateDatasetDto) {
    const response = await lastValueFrom(
      this.fileClient.send({ cmd: 'dataset.create' }, { userId, dto }),
    );
    return formatResponse(201, response?.result, '创建数据集成功');
  }

  async getDatasetDetail(datasetId: number) {
    const response = await lastValueFrom(
      this.fileClient.send({ cmd: 'dataset.detail' }, { datasetId }),
    );
    return formatResponse(200, response?.result, '获取数据集详情成功');
  }

  async updateDataset(
    datasetId: number,
    userId: number,
    dto: UpdateDatasetDto,
  ) {
    const response = await lastValueFrom(
      this.fileClient.send(
        { cmd: 'dataset.update' },
        { datasetId, userId, dto },
      ),
    );
    return formatResponse(200, response?.result, '更新数据集成功');
  }

  async deleteDataset(datasetId: number, userId: number) {
    await firstValueFrom(
      this.fileClient.send({ cmd: 'dataset.delete' }, { datasetId, userId }),
    );
    return formatResponse(204, null, '删除数据集成功');
  }
}
