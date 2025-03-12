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
  async createTask(@Payload() data: any) {
    return { message: 'task create', data };
  }

  @MessagePattern({ cmd: 'task.get' })
  async getTask(@Payload() data: any) {
    return { message: 'task get', data };
  }
}
