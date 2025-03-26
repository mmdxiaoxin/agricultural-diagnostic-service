import { File as FileEntity } from '@app/database/entities';
import { Injectable, Logger } from '@nestjs/common';
import * as archiver from 'archiver';
import { createReadStream, existsSync } from 'fs';

@Injectable()
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name);

  // TCP 服务方法
  async downloadFile(data: { fileMeta: FileEntity }) {
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
      return { success: true, data: fileData.toString('base64') };
    } catch (err) {
      this.logger.error(`下载失败: ${err.message}`);
      return { success: false, message: '文件下载失败' };
    }
  }

  async downloadFilesAsZip(data: { filesMeta: FileEntity[] }) {
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

        // 遍历所有文件并添加到 zip
        for (const fileMeta of data.filesMeta) {
          const filePath = fileMeta.filePath;
          if (existsSync(filePath)) {
            zip.append(createReadStream(filePath), {
              name: fileMeta.originalFileName,
            });
          } else {
            this.logger.warn(`文件未找到: ${filePath}`);
          }
        }
        zip.finalize();
      });

      return { success: true, data: zipBuffer.toString('base64') };
    } catch (err) {
      this.logger.error(`打包失败: ${err.message}`);
      return { success: false, message: '文件打包失败' };
    }
  }

  // gRPC 服务方法
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
      this.logger.error(`gRPC下载失败: ${err.message}`);
      return { success: false, message: '文件下载失败' };
    }
  }

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
          } else {
            this.logger.warn(`文件未找到: ${filePath}`);
          }
        }
        zip.finalize();
      });

      return { success: true, data: zipBuffer, message: '打包成功' };
    } catch (err) {
      this.logger.error(`gRPC打包失败: ${err.message}`);
      return { success: false, message: '文件打包失败' };
    }
  }
}
