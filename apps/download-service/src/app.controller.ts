import {
  DownloadFileRequest,
  DownloadFileResponse,
  DownloadFilesRequest,
  DownloadFilesResponse,
} from '@common/types/download/download.types';
import { Controller } from '@nestjs/common';
import { GrpcMethod, MessagePattern, Payload } from '@nestjs/microservices';
import { DOWNLOAD_MESSAGE_PATTERNS } from '@shared/constants/download-message-patterns';
import { DownloadService } from './app.service';

@Controller()
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @MessagePattern({ cmd: DOWNLOAD_MESSAGE_PATTERNS.FILE_DOWNLOAD })
  async downloadFile(
    @Payload() payload: DownloadFileRequest,
  ): Promise<DownloadFileResponse> {
    return this.downloadService.downloadFile(payload);
  }

  @MessagePattern({ cmd: DOWNLOAD_MESSAGE_PATTERNS.FILES_DOWNLOAD })
  async downloadFiles(
    @Payload() payload: DownloadFilesRequest,
  ): Promise<DownloadFilesResponse> {
    return this.downloadService.downloadFilesAsZip(payload);
  }

  @GrpcMethod('DownloadService', 'DownloadFile')
  async downloadFileGrpc(
    data: DownloadFileRequest,
  ): Promise<DownloadFileResponse> {
    return this.downloadService.downloadFileGrpc(data);
  }

  @GrpcMethod('DownloadService', 'DownloadFiles')
  async downloadFilesGrpc(
    data: DownloadFilesRequest,
  ): Promise<DownloadFilesResponse> {
    return this.downloadService.downloadFilesGrpc(data);
  }
}
