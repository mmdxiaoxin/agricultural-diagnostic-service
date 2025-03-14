import {
  UpdateFileDto,
  UpdateFilesAccessDto,
} from '@common/dto/file/update-file.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FILE_MESSAGE_PATTERNS } from '@shared/constants/file-message-patterns';
import { FileService } from './file.service';

@Controller()
export class FileController {
  constructor(private fileService: FileService) {}

  @MessagePattern({ cmd: FILE_MESSAGE_PATTERNS.GET_FILE })
  async getFile(@Payload() payload: { fileId: number }) {
    return this.fileService.getFile(payload.fileId);
  }

  @MessagePattern({ cmd: FILE_MESSAGE_PATTERNS.GET_FILE_BY_ID })
  async getFileById(@Payload() payload: { fileId: number }) {
    return this.fileService.getFileById(payload.fileId);
  }

  @MessagePattern({ cmd: FILE_MESSAGE_PATTERNS.UPDATE_FILE })
  async updateFile(@Payload() payload: { userId: number; dto: UpdateFileDto }) {
    return this.fileService.updateFile(payload.userId, payload.dto);
  }

  @MessagePattern({ cmd: FILE_MESSAGE_PATTERNS.DELETE_FILE })
  async deleteFile(@Payload() payload: { fileId: number; userId: number }) {
    return this.fileService.deleteFile(payload.fileId, payload.userId);
  }

  @MessagePattern({ cmd: FILE_MESSAGE_PATTERNS.GET_FILES })
  async getFiles(@Payload() payload: { userId: number }) {
    return this.fileService.getFiles(payload.userId);
  }

  @MessagePattern({ cmd: FILE_MESSAGE_PATTERNS.GET_FILES_BY_ID })
  async getFilesById(@Payload() payload: { fileIds: number[] }) {
    return this.fileService.getFilesById(payload.fileIds);
  }

  @MessagePattern({ cmd: FILE_MESSAGE_PATTERNS.GET_FILES_LIST })
  async getFilesList(
    @Payload()
    payload: {
      page: number;
      pageSize: number;
      filters: {
        fileType?: string[];
        originalFileName?: string;
        createdStart?: string;
        createdEnd?: string;
        updatedStart?: string;
        updatedEnd?: string;
      };
      userId: number;
    },
  ) {
    return this.fileService.getFilesList(
      payload.page,
      payload.pageSize,
      payload.filters,
      payload.userId,
    );
  }

  @MessagePattern({ cmd: FILE_MESSAGE_PATTERNS.UPDATE_FILES_ACCESS })
  async updateFilesAccess(
    @Payload() payload: { userId: number; dto: UpdateFilesAccessDto },
  ) {
    return this.fileService.updateFilesAccess(payload.userId, payload.dto);
  }

  @MessagePattern({ cmd: FILE_MESSAGE_PATTERNS.DELETE_FILES })
  async deleteFiles(@Payload() payload: { fileIds: number[]; userId: number }) {
    return this.fileService.deleteFiles(payload.fileIds, payload.userId);
  }

  @MessagePattern({ cmd: FILE_MESSAGE_PATTERNS.FILES_STATISTIC_USAGE })
  async getFilesStatisticUsage(@Payload() payload: { userId: number }) {
    return this.fileService.getFilesStatisticUsage(payload.userId);
  }
}
