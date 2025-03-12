import { CreateTaskDto } from '@common/dto/file/create-task.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UploadService } from './app.service';
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

  @MessagePattern({ cmd: 'upload.chunk' })
  async chunkFile(
    @Payload() data: { chunkMeta: Express.Multer.File; chunkData: Buffer },
  ) {
    return { message: 'File chunked', data };
  }

  @MessagePattern({ cmd: 'upload.complete' })
  async completeFile(@Payload() data: any) {
    return { message: 'File completed', data };
  }

  @MessagePattern({ cmd: 'task.create' })
  async createTask(
    @Payload() data: { userId: number; taskMeta: CreateTaskDto },
  ) {
    return this.uploadService.createTask(data.userId, data.taskMeta);
  }

  @MessagePattern({ cmd: 'task.get' })
  async getTask(@Payload() data: { taskId: number }) {
    return this.uploadService.getTask(data.taskId);
  }
}
