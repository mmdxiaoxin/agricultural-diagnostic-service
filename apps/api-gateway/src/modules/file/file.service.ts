import { CompleteChunkDto } from '@common/dto/file/complete-chunk.dto';
import { CreateTaskDto } from '@common/dto/file/create-task.dto';
import {
  UpdateFileDto,
  UpdateFilesAccessDto,
} from '@common/dto/file/update-file.dto';
import { UploadChunkDto } from '@common/dto/file/upload-chunk.dto';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { DOWNLOAD_MESSAGE_PATTERNS } from '@shared/constants/download-message-patterns';
import { formatResponse } from '@shared/helpers/response.helper';
import {
  DOWNLOAD_SERVICE_NAME,
  FILE_SERVICE_NAME,
  UPLOAD_SERVICE_NAME,
} from 'config/microservice.config';
import { Response } from 'express';
import {
  defaultIfEmpty,
  firstValueFrom,
  lastValueFrom,
  Observable,
} from 'rxjs';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    @Inject(UPLOAD_SERVICE_NAME) private readonly uploadClient: ClientProxy,
    @Inject(FILE_SERVICE_NAME) private readonly fileClient: ClientProxy,
    @Inject(DOWNLOAD_SERVICE_NAME) private readonly downloadClient: ClientProxy,
  ) {}

  async getDiskUsage(userId: number) {
    const response = await lastValueFrom(
      this.fileClient.send({ cmd: 'files.statistic.usage' }, { userId }),
    );
    return formatResponse(200, response?.result, '获取空间使用信息成功');
  }

  async getFiles(userId: number) {
    const rpcResponse = await lastValueFrom(
      this.fileClient.send({ cmd: 'files.get' }, { userId }),
    );
    return formatResponse(200, rpcResponse?.result, '文件列表查询成功');
  }

  async getFileList(params: {
    userId: number;
    page?: number;
    pageSize?: number;
    fileType?: string[];
    originalFileName?: string;
    createdStart?: string;
    createdEnd?: string;
    updatedStart?: string;
    updatedEnd?: string;
  }) {
    const { userId, page, pageSize, ...filters } = params;
    const rpcResponse = await lastValueFrom(
      this.fileClient.send(
        { cmd: 'files.get.list' },
        {
          page,
          pageSize,
          filters,
          userId,
        },
      ),
    );
    return formatResponse(200, rpcResponse?.result, '文件列表查询成功');
  }

  async uploadSingle(file: Express.Multer.File, userId: number) {
    try {
      const rpcResponse = await firstValueFrom(
        this.uploadClient.send(
          { cmd: 'upload.single' },
          {
            fileMeta: {
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
            },
            fileData: file.buffer.toString('base64'),
            userId,
          },
        ),
      );
      return formatResponse(200, rpcResponse, '上传成功');
    } catch (error) {
      throw error;
    }
  }

  async createUploadTask(dto: CreateTaskDto, userId: number) {
    const preloadResponse = await lastValueFrom(
      this.uploadClient.send(
        { cmd: 'upload.preload' },
        {
          fileMd5: dto.fileMd5,
          originalFileName: dto.fileName,
          userId,
        },
      ),
    );
    if (!preloadResponse) {
      throw new InternalServerErrorException('文件预加载失败');
    }
    if (preloadResponse.success) {
      return formatResponse(200, preloadResponse, '文件已快速上传');
    }
    const createResponse = await firstValueFrom(
      this.uploadClient.send(
        { cmd: 'task.create' },
        {
          ...dto,
          userId,
        },
      ),
    );
    return formatResponse(201, createResponse, '任务创建成功');
  }

  async getUploadTaskStatus(taskId: string) {
    const rpcResponse = await lastValueFrom(
      this.uploadClient.send({ cmd: 'task.get' }, { taskId }),
    );
    return formatResponse(200, rpcResponse?.result, '任务查询成功');
  }

  async completeUpload(dto: CompleteChunkDto) {
    const rpcResponse = await lastValueFrom(
      this.uploadClient.send(
        { cmd: 'upload.complete' },
        { taskId: dto.taskId },
      ),
    );
    return formatResponse(200, rpcResponse?.result, '上传成功');
  }

  async uploadChunk(file: Express.Multer.File, dto: UploadChunkDto) {
    const rpcResponse = await lastValueFrom(
      this.uploadClient.send(
        { cmd: 'upload.chunk' },
        {
          taskMeta: dto,
          chunkData: file.buffer.toString('base64'),
        },
      ),
    );
    return formatResponse(200, rpcResponse?.result, '上传成功');
  }

  async downloadFile(fileMeta: any, res: Response) {
    try {
      const response = await lastValueFrom(
        this.downloadClient.send(
          { cmd: DOWNLOAD_MESSAGE_PATTERNS.FILE_DOWNLOAD },
          { fileMeta },
        ),
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

      res.set({
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileMeta.originalFileName)}"`,
        'Content-Type': fileMeta.fileType || 'application/octet-stream',
        'Content-Length': fileBuffer.length.toString(),
      });

      res.send(fileBuffer);
    } catch (err) {
      this.logger.error(`下载失败: ${err.message}`);
      throw new InternalServerErrorException('文件下载失败');
    }
  }

  async downloadFiles(filesMeta: any[], res: Response) {
    const response = await lastValueFrom(
      this.downloadClient.send({ cmd: 'files.download' }, { filesMeta }),
    );
    if (!response.success || !response.data) {
      throw new HttpException(
        response.message || '文件获取失败',
        HttpStatus.NOT_FOUND,
      );
    }
    const fileBuffer = Buffer.from(response.data, 'base64');
    res.set({
      'Content-Type': 'application/zip',
    });
    res.end(fileBuffer);
  }

  async updateFile(dto: UpdateFileDto, userId: number) {
    await firstValueFrom(
      this.fileClient.send(
        { cmd: 'file.update' },
        {
          userId,
          dto,
        },
      ),
    );
    return formatResponse(200, null, '文件修改成功');
  }

  async updateFilesAccess(dto: UpdateFilesAccessDto, userId: number) {
    await firstValueFrom(
      this.fileClient.send(
        { cmd: 'files.update.access' },
        {
          userId,
          dto,
        },
      ),
    );
    return formatResponse(200, null, '权限修改成功');
  }

  async deleteFile(fileId: number, userId: number): Promise<Observable<any>> {
    return this.fileClient
      .send(
        { cmd: 'file.delete' },
        {
          fileId,
          userId,
        },
      )
      .pipe(defaultIfEmpty(null));
  }

  async deleteFiles(
    fileIds: number[],
    userId: number,
  ): Promise<Observable<any>> {
    return this.fileClient
      .send(
        { cmd: 'files.delete' },
        {
          fileIds,
          userId,
        },
      )
      .pipe(defaultIfEmpty(null));
  }
}
