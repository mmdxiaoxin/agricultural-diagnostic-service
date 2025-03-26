import { File as FileEntity } from '@app/database/entities';
import { Controller } from '@nestjs/common';
import { GrpcMethod, MessagePattern, Payload } from '@nestjs/microservices';
import { DOWNLOAD_MESSAGE_PATTERNS } from '@shared/constants/download-message-patterns';
import * as archiver from 'archiver';
import { createReadStream, existsSync } from 'fs';
import { DownloadService } from './app.service';

@Controller()
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @MessagePattern({ cmd: DOWNLOAD_MESSAGE_PATTERNS.FILE_DOWNLOAD })
  async downloadFile(@Payload() payload: { fileMeta: FileEntity }) {
    return this.downloadService.downloadFile(payload);
  }

  @MessagePattern({ cmd: DOWNLOAD_MESSAGE_PATTERNS.FILES_DOWNLOAD })
  async downloadFiles(@Payload() payload: { filesMeta: FileEntity[] }) {
    return this.downloadService.downloadFilesAsZip(payload);
  }

  @GrpcMethod('DownloadService', 'DownloadFile')
  async downloadFileGrpc(data: { fileMeta: FileEntity }) {
    try {
      const filePath = data.fileMeta.filePath;
      if (!filePath || !existsSync(filePath)) {
        return { success: false, message: '文件不存在' };
      }

      const fileStream = createReadStream(filePath);
      let fileData = Buffer.alloc(0);
      for await (const chunk of fileStream) {
        fileData = Buffer.concat([fileData, chunk]);
      }
      return { success: true, data: fileData, message: '下载成功' };
    } catch (err) {
      return { success: false, message: '文件下载失败' };
    }
  }

  @GrpcMethod('DownloadService', 'DownloadFiles')
  async downloadFilesGrpc(data: { filesMeta: FileEntity[] }) {
    try {
      if (!data.filesMeta || data.filesMeta.length === 0) {
        return { success: false, message: '没有可下载的文件' };
      }

      const zip = archiver('zip', { zlib: { level: 9 } });
      let zipBuffer = Buffer.alloc(0);
      zip.on('data', (chunk) => {
        zipBuffer = Buffer.concat([zipBuffer, chunk]);
      });

      await new Promise<void>((resolve, reject) => {
        zip.on('end', resolve);
        zip.on('error', reject);

        for (const fileMeta of data.filesMeta) {
          const filePath = fileMeta.filePath;
          if (existsSync(filePath)) {
            zip.append(createReadStream(filePath), {
              name: fileMeta.originalFileName,
            });
          }
        }
        zip.finalize();
      });

      return { success: true, data: zipBuffer, message: '打包成功' };
    } catch (err) {
      return { success: false, message: '文件打包失败' };
    }
  }
}
