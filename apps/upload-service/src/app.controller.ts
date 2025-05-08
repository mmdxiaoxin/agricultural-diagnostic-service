import {
  ChunkFileRequest,
  CompleteFileRequest,
  CompleteFileResponse,
  CreateTaskRequest,
  CreateTaskResponse,
  GetTaskRequest,
  GetTaskResponse,
  PreloadFileRequest,
  PreloadFileResponse,
  SaveFileRequest,
  SaveFileResponse,
} from '@common/types/upload';
import { Controller } from '@nestjs/common';
import { GrpcMethod, MessagePattern, Payload } from '@nestjs/microservices';
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
      Buffer.from(payload.fileData, 'base64'),
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
    return this.uploadService.chunkFile(
      payload.taskMeta,
      Buffer.from(payload.chunkData, 'base64'),
    );
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

  @GrpcMethod('UploadService', 'SaveFile')
  async grpcSaveFile(request: SaveFileRequest): Promise<SaveFileResponse> {
    return this.uploadService.saveFile(
      request.fileMeta,
      Buffer.from(request.fileData),
      request.userId,
    );
  }

  @GrpcMethod('UploadService', 'PreloadFile')
  async grpcPreloadFile(
    request: PreloadFileRequest,
  ): Promise<PreloadFileResponse> {
    // @ts-ignore
    return this.uploadService.preloadFile(
      request.fileMd5,
      request.originalFileName,
      request.userId,
    );
  }

  @GrpcMethod('UploadService', 'ChunkFile')
  async grpcChunkFile(request: ChunkFileRequest) {
    return this.uploadService.chunkFile(
      request.taskMeta,
      Buffer.from(request.chunkData),
    );
  }

  @GrpcMethod('UploadService', 'CompleteFile')
  async grpcCompleteFile(
    request: CompleteFileRequest,
  ): Promise<CompleteFileResponse> {
    return this.uploadService.completeUpload(request.taskId);
  }

  @GrpcMethod('UploadService', 'CreateTask')
  async grpcCreateTask(
    request: CreateTaskRequest,
  ): Promise<CreateTaskResponse> {
    return this.uploadService.createTask(request);
  }

  @GrpcMethod('UploadService', 'GetTask')
  async grpcGetTask(request: GetTaskRequest): Promise<GetTaskResponse> {
    return this.uploadService.getTask(request.taskId);
  }
}
