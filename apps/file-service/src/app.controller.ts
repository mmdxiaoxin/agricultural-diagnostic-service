import {
  UpdateFileDto,
  UpdateFilesAccessDto,
} from '@common/dto/file/update-file.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FileService } from './app.service';

@Controller()
export class FileController {
  constructor(private fileService: FileService) {}

  @MessagePattern({ cmd: 'file.update' })
  async updateFile(@Payload() payload: { userId: number; dto: UpdateFileDto }) {
    return this.fileService.updateFile(payload.userId, payload.dto);
  }

  @MessagePattern({ cmd: 'files.update.access' })
  async updateFilesAccess(
    @Payload() payload: { userId: number; dto: UpdateFilesAccessDto },
  ) {
    return this.fileService.updateFilesAccess(payload.userId, payload.dto);
  }

  @MessagePattern({ cmd: 'file.delete' })
  async deleteFile(@Payload() payload: { fileId: number; userId: number }) {
    return this.fileService.deleteFile(payload.fileId, payload.userId);
  }

  @MessagePattern({ cmd: 'files.delete' })
  async deleteFiles(@Payload() payload: { fileIds: number[]; userId: number }) {
    return this.fileService.deleteFiles(payload.fileIds, payload.userId);
  }
}
