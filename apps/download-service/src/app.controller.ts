import {
  DownloadFileChunk,
  DownloadFileRequest,
  DownloadFileResponse,
  DownloadFilesRequest,
  DownloadFilesResponse,
} from '@common/types/download/download.types';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { DownloadService } from './app.service';

@Controller()
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @GrpcMethod('DownloadService', 'DownloadFile')
  async downloadFileGrpc(
    data: DownloadFileRequest,
  ): Promise<DownloadFileResponse> {
    return this.downloadService.downloadFileGrpc(data);
  }

  @GrpcMethod('DownloadService', 'DownloadFileStream')
  downloadFileStream(data: DownloadFileRequest): Observable<DownloadFileChunk> {
    return new Observable<DownloadFileChunk>((subscriber) => {
      const process = async () => {
        try {
          for await (const chunk of this.downloadService.downloadFileStreamGrpc(
            data,
          )) {
            subscriber.next(chunk);
          }
          subscriber.complete();
        } catch (error) {
          subscriber.error(error);
        }
      };
      process();
    });
  }

  @GrpcMethod('DownloadService', 'DownloadFiles')
  async downloadFilesGrpc(
    data: DownloadFilesRequest,
  ): Promise<DownloadFilesResponse> {
    return this.downloadService.downloadFilesGrpc(data);
  }
}
