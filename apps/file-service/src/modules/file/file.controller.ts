import {
  UpdateFileDto,
  UpdateFilesAccessDto,
} from '@common/dto/file/update-file.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FILE_MESSAGE_PATTERNS } from '@shared/constants/file-message-patterns';
import { FileService } from './file.service';
import { FileQueryDto } from '@common/dto/file/file-query.dto';

@Controller()
export class FileController {
  constructor(private fileService: FileService) {}

  @MessagePattern({ cmd: FILE_MESSAGE_PATTERNS.FILE_GET_BYID })
  async findById(@Payload() payload: { fileId: number }) {
    return this.fileService.findById(payload.fileId);
  }

  @MessagePattern({ cmd: FILE_MESSAGE_PATTERNS.FILE_UPDATE })
  async update(@Payload() payload: { userId: number; dto: UpdateFileDto }) {
    return this.fileService.update(payload.userId, payload.dto);
  }

  @MessagePattern({ cmd: FILE_MESSAGE_PATTERNS.FILE_DELETE })
  async delete(@Payload() payload: { fileId: number; userId: number }) {
    return this.fileService.delete(payload.fileId, payload.userId);
  }

  @MessagePattern({ cmd: FILE_MESSAGE_PATTERNS.FILE_GET })
  async findAll(@Payload() payload: { userId: number }) {
    return this.fileService.findAll(payload.userId);
  }

  @MessagePattern({ cmd: FILE_MESSAGE_PATTERNS.FILE_GET_BYIDS })
  async findByIds(@Payload() payload: { fileIds: number[] }) {
    return this.fileService.findByIds(payload.fileIds);
  }

  @MessagePattern({ cmd: FILE_MESSAGE_PATTERNS.FILE_GET_LIST })
  async findList(
    @Payload()
    payload: {
      query: FileQueryDto;
      userId: number;
    },
  ) {
    const { page = 1, pageSize = 10, ...filters } = payload.query;
    return this.fileService.findList(page, pageSize, filters, payload.userId);
  }

  @MessagePattern({ cmd: FILE_MESSAGE_PATTERNS.FILE_UPDATE_ACCESS })
  async updateAccessBatch(
    @Payload() payload: { userId: number; dto: UpdateFilesAccessDto },
  ) {
    return this.fileService.updateAccessBatch(payload.userId, payload.dto);
  }

  @MessagePattern({ cmd: FILE_MESSAGE_PATTERNS.FILE_DELETE_BATCH })
  async deleteBatch(@Payload() payload: { fileIds: number[]; userId: number }) {
    return this.fileService.deleteBatch(payload.fileIds, payload.userId);
  }

  @MessagePattern({ cmd: FILE_MESSAGE_PATTERNS.FILE_DISK })
  async findDisk(@Payload() payload: { userId: number }) {
    return this.fileService.findDisk(payload.userId);
  }
}
