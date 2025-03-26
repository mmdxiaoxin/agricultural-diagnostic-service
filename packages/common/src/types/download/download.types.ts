import { File as FileEntity } from '@app/database/entities';

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
export interface IDownloadService {
  downloadFile(request: DownloadFileRequest): Promise<DownloadFileResponse>;
  downloadFiles(request: DownloadFilesRequest): Promise<DownloadFilesResponse>;
}
