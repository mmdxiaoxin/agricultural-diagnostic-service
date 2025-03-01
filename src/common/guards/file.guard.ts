import { FileService } from '@/modules/file/file.service';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';

interface CustomRequest extends Request<any> {
  params: { fileId: number };
  body: { file_ids: number[] };
  user?: { userId: number };
}

@Injectable()
export class FileGuard implements CanActivate {
  constructor(private readonly fileService: FileService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<CustomRequest>();
    const fileId = request.params.fileId;
    const userId = request.user?.userId;

    const file = await this.fileService.findById(fileId);
    if (!file) {
      throw new NotFoundException('File not found.');
    }

    if (
      file.access === 'public' ||
      (file.access === 'private' && userId === file.createdBy)
    ) {
      return true;
    }

    throw new ForbiddenException('Access denied.');
  }
}

@Injectable()
export class FilesGuard implements CanActivate {
  constructor(private readonly fileService: FileService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<CustomRequest>();
    const fileIds = request.body.file_ids;
    const userId = request.user?.userId;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      throw new ForbiddenException('Invalid file_ids parameter');
    }

    const files = await this.fileService.findByIds(fileIds);
    if (files.length !== fileIds.length) {
      throw new NotFoundException('Some files not found.');
    }

    for (const file of files) {
      if (
        file.access === 'public' ||
        (file.access === 'private' && userId === file.createdBy)
      ) {
        continue;
      }
      throw new ForbiddenException('Access denied.');
    }

    return true;
  }
}
