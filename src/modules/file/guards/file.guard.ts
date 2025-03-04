import { FileService } from '@/modules/file/services/file.service';
import { File as FileEntity } from '@/modules/file/models/file.entity';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';

export type DownloadRequest = Request<
  { fileId: number },
  any,
  { fileIds: number[] },
  any
>;

declare global {
  namespace Express {
    interface Request {
      fileMeta: FileEntity;
      filesMeta: FileEntity[];
    }
  }
}

@Injectable()
export class FileGuard implements CanActivate {
  constructor(private readonly fileService: FileService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<DownloadRequest>();
    const fileId = request.params.fileId;
    const userId = request.user?.userId;

    // 查询文件信息并将其存储到 request.file 中
    const file = await this.fileService.findById(fileId);

    // 处理权限验证
    if (
      file.access === 'public' ||
      (file.access === 'private' && userId === file.createdBy)
    ) {
      request.fileMeta = file; // 将文件信息存储到请求中
      return true;
    }

    throw new ForbiddenException('当前文件无权限访问.');
  }
}

@Injectable()
export class FilesGuard implements CanActivate {
  constructor(private readonly fileService: FileService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<DownloadRequest>();
    const fileIds = request.body.fileIds;
    const userId = request.user?.userId;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      throw new BadRequestException('非法参数');
    }

    // 查询多个文件信息并将其存储到请求中
    const files = await this.fileService.findByIds(fileIds);

    const filesWithAccess: FileEntity[] = [];

    for (const file of files) {
      if (
        file.access === 'public' ||
        (file.access === 'private' && userId === file.createdBy)
      ) {
        filesWithAccess.push(file); // 只有有权限的文件才会被加入
      } else {
        throw new ForbiddenException('您无权操作.');
      }
    }

    request.filesMeta = filesWithAccess; // 将文件信息存储到请求中
    return true;
  }
}
