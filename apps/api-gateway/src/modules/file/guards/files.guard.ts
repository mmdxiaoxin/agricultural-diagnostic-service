import { FileEntity } from '@app/database/entities';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FILE_MESSAGE_PATTERNS } from '@shared/constants/file-message-patterns';
import { FILE_SERVICE_NAME } from 'config/microservice.config';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';

export type DownloadRequest = Request<any, any, { fileIds: number[] }>;

declare global {
  namespace Express {
    interface Request {
      filesMeta: FileEntity[];
    }
  }
}

@Injectable()
export class FilesGuard implements CanActivate {
  constructor(
    @Inject(FILE_SERVICE_NAME) private readonly fileClient: ClientProxy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<DownloadRequest>();
    const fileIds = request.body.fileIds;
    const userId = request.user?.userId;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      throw new BadRequestException('非法参数');
    }

    // 远程调用 file-service 获取多个文件信息
    const { result: files } = await firstValueFrom(
      this.fileClient.send<
        {
          success: boolean;
          result: FileEntity[];
        },
        { fileIds: number[] }
      >({ cmd: FILE_MESSAGE_PATTERNS.FILE_GET_BYIDS }, { fileIds }),
    );

    if (!files || files.length === 0) {
      throw new BadRequestException('文件不存在');
    }

    const filesWithAccess: FileEntity[] = [];

    for (const file of files) {
      if (
        file.access === 'public' ||
        (file.access === 'private' && userId === file.createdBy)
      ) {
        filesWithAccess.push(file);
      } else {
        throw new ForbiddenException('您无权操作.');
      }
    }

    request.filesMeta = filesWithAccess;
    return true;
  }
}
