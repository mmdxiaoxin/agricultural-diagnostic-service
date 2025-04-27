import { FileEntity } from '@app/database/entities';
import { CreateDatasetDto } from '@common/dto/dataset/create-dataset.dto';
import { UpdateDatasetAccessDto } from '@common/dto/dataset/update-dataset-access.dto';
import { UpdateDatasetDto } from '@common/dto/dataset/update-dataset.dto';
import { DatasetQueryDto } from '@common/dto/diagnosis/dastaset-query.dto';
import { GrpcDownloadService } from '@common/types/download/download.types';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ClientGrpc, ClientProxy } from '@nestjs/microservices';
import {
  DOWNLOAD_SERVICE_NAME,
  FILE_SERVICE_NAME,
} from 'config/microservice.config';
import { Response } from 'express';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class DatasetService {
  private downloadService: GrpcDownloadService;
  private readonly logger = new Logger(DatasetService.name);
  constructor(
    @Inject(FILE_SERVICE_NAME) private readonly fileClient: ClientProxy,
    @Inject(DOWNLOAD_SERVICE_NAME) private readonly downloadClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.downloadService =
      this.downloadClient.getService<GrpcDownloadService>('DownloadService');
  }

  getDatasetList(query: DatasetQueryDto, userId: number) {
    return this.fileClient.send({ cmd: 'dataset.get.list' }, { query, userId });
  }

  getPublicDatasetList(query: DatasetQueryDto) {
    return this.fileClient.send({ cmd: 'dataset.get.public.list' }, { query });
  }

  createDataset(userId: number, dto: CreateDatasetDto) {
    return this.fileClient.send({ cmd: 'dataset.create' }, { userId, dto });
  }

  copyDataset(datasetId: number, userId: number) {
    return this.fileClient.send({ cmd: 'dataset.copy' }, { datasetId, userId });
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

  updateDatasetAccess(
    datasetId: number,
    userId: number,
    dto: UpdateDatasetAccessDto,
  ) {
    return this.fileClient.send(
      { cmd: 'dataset.update.access' },
      { datasetId, userId, dto },
    );
  }

  deleteDataset(datasetId: number, userId: number) {
    return this.fileClient.send(
      { cmd: 'dataset.delete' },
      { datasetId, userId },
    );
  }

  async downloadDataset(datasetId: number, res: Response) {
    try {
      const filesMeta = await lastValueFrom(
        this.fileClient.send<FileEntity[]>(
          { cmd: 'dataset.get.file.meta' },
          { datasetId },
        ),
      );

      if (filesMeta.length === 0) {
        throw new HttpException('数据集没有可下载的文件', HttpStatus.NOT_FOUND);
      }

      const response = await lastValueFrom(
        this.downloadService.downloadFiles({ filesMeta }),
      );

      if (!response.success || !response.data) {
        throw new HttpException(
          response.message || '文件获取失败',
          HttpStatus.NOT_FOUND,
        );
      }

      const fileBuffer = Buffer.isBuffer(response.data)
        ? response.data
        : Buffer.from(response.data);

      // 设置响应头
      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="dataset-${datasetId}.zip"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      });

      // 使用流式传输
      const chunkSize = 1024 * 1024; // 1MB chunks
      let offset = 0;

      while (offset < fileBuffer.length) {
        const chunk = fileBuffer.subarray(
          offset,
          Math.min(offset + chunkSize, fileBuffer.length),
        );
        res.write(chunk);
        offset += chunk.length;
      }

      res.end();
    } catch (err) {
      this.logger.error(`下载失败: ${err.message}`);
      throw new InternalServerErrorException('文件下载失败');
    }
  }
}
