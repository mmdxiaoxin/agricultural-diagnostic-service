import { FileEntity } from '@app/database/entities';
import { Observable } from 'rxjs';

// 请求类型
export interface DownloadFileRequest {
  fileMeta: FileEntity;
}

export interface DownloadFilesRequest {
  filesMeta: FileEntity[];
}

// 响应类型
export interface DownloadFileResponse {
  success: boolean;
  data: Buffer;
  message: string;
}

export interface DownloadFilesResponse {
  success: boolean;
  data: Buffer;
  message: string;
}

// 服务接口定义
export interface GrpcDownloadService {
  downloadFile(request: DownloadFileRequest): Observable<DownloadFileResponse>;
  downloadFiles(
    request: DownloadFilesRequest,
  ): Observable<DownloadFilesResponse>;
  downloadFileStream(
    request: DownloadFileRequest,
  ): Observable<DownloadFileChunk>;
}

// 下载文件分片
export interface DownloadFileChunk {
  chunk: Buffer;
  success: boolean;
  message: string;
}
