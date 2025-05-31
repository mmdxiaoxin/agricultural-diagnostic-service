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
import { GrpcMethod } from '@nestjs/microservices';
import { UploadService } from './app.service';

@Controller()
export class UploadController {
  constructor(private uploadService: UploadService) {}

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
