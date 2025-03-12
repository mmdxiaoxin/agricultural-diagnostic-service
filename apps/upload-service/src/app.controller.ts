import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UploadService } from './app.service';
import { TaskCreateDto } from './dto/task-create.dto';
import { UploadChunkDto } from './dto/upload-chunk.dto';
import { UploadPreloadDto } from './dto/upload-preload.dto';
import { UploadSingleDto } from './dto/upload-single.dto';

@Controller()
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @MessagePattern({ cmd: 'upload.single' })
  async saveFile(@Payload() payload: UploadSingleDto) {
    return this.uploadService.saveFile(
      payload.fileMeta,
      payload.fileData,
      payload.userId,
    );
  }

  @MessagePattern({ cmd: 'upload.preload' })
  async preloadFile(@Payload() payload: UploadPreloadDto) {
    return this.uploadService.preloadFile(
      payload.fileMd5,
      payload.originalFileName,
      payload.userId,
    );
  }

  @MessagePattern({ cmd: 'upload.chunk' })
  async chunkFile(@Payload() payload: UploadChunkDto) {
    return this.uploadService.chunkFile(payload.chunkMeta, payload.chunkData);
  }

  @MessagePattern({ cmd: 'upload.complete' })
  async completeFile(@Payload() payload: { taskId: string }) {
    return this.uploadService.completeUpload(payload.taskId);
  }

  @MessagePattern({ cmd: 'task.create' })
  async createTask(@Payload() payload: TaskCreateDto) {
    return this.uploadService.createTask(payload);
  }

  @MessagePattern({ cmd: 'task.get' })
  async getTask(@Payload() payload: { taskId: string }) {
    return this.uploadService.getTask(payload.taskId);
  }
}
