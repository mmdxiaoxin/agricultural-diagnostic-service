import { File as FileEntity } from '@app/database/entities';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FILE_SERVICE_NAME } from 'config/microservice.config';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';

export type DownloadRequest = Request<{ fileId: number }>;

declare global {
  namespace Express {
    interface Request {
      fileMeta: FileEntity;
    }
  }
}

@Injectable()
export class FileGuard implements CanActivate {
  constructor(
    @Inject(FILE_SERVICE_NAME) private readonly fileClient: ClientProxy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<DownloadRequest>();
    const fileId = request.params.fileId;
    const userId = request.user?.userId;

    if (!fileId) {
      throw new BadRequestException('文件 ID 不能为空');
    }

    // 远程调用 file-service 获取文件信息
    const { result: file } = await firstValueFrom(
      this.fileClient.send<
        { success: boolean; result: FileEntity | null },
        number
      >('file.get.byId', fileId),
    );

    if (!file) {
      throw new BadRequestException('文件不存在');
    }

    if (
      file.access === 'public' ||
      (file.access === 'private' && userId === file.createdBy)
    ) {
      request.fileMeta = file;
      return true;
    }

    throw new ForbiddenException('当前文件无权限访问.');
  }
}
