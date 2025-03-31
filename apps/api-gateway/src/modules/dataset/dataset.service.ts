import { CreateDatasetDto } from '@common/dto/dataset/create-dataset.dto';
import { UpdateDatasetDto } from '@common/dto/dataset/update-dataset.dto';
import { DatasetQueryDto } from '@common/dto/diagnosis/dastaset-query.dto';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FILE_SERVICE_NAME } from 'config/microservice.config';

@Injectable()
export class DatasetService {
  constructor(
    @Inject(FILE_SERVICE_NAME) private readonly fileClient: ClientProxy,
  ) {}

  getDatasetList(query: DatasetQueryDto, userId: number) {
    return this.fileClient.send({ cmd: 'dataset.get.list' }, { query, userId });
  }

  getPublicDatasetList(query: DatasetQueryDto) {
    return this.fileClient.send({ cmd: 'dataset.get.public.list' }, { query });
  }

  createDataset(userId: number, dto: CreateDatasetDto) {
    return this.fileClient.send({ cmd: 'dataset.create' }, { userId, dto });
  }

  getDatasetDetail(datasetId: number) {
    return this.fileClient.send({ cmd: 'dataset.detail' }, { datasetId });
  }

  updateDataset(datasetId: number, userId: number, dto: UpdateDatasetDto) {
    return this.fileClient.send(
      { cmd: 'dataset.update' },
      { datasetId, userId, dto },
    );
  }

  deleteDataset(datasetId: number, userId: number) {
    return this.fileClient.send(
      { cmd: 'dataset.delete' },
      { datasetId, userId },
    );
  }
}
