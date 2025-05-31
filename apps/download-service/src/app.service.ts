import {
  DownloadFileChunk,
  DownloadFileRequest,
  DownloadFileResponse,
  DownloadFilesRequest,
  DownloadFilesResponse,
} from '@common/types/download/download.types';
import { Injectable, Logger } from '@nestjs/common';
import * as archiver from 'archiver';
import { createReadStream, existsSync } from 'fs';

@Injectable()
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name);

  // gRPC 服务方法
  async downloadFileGrpc(
    data: DownloadFileRequest,
  ): Promise<DownloadFileResponse> {
    try {
      const filePath = data.fileMeta.filePath;
      if (!filePath || !existsSync(filePath)) {
        return { success: false, message: '文件不存在', data: Buffer.alloc(0) };
      }

      const fileStream = createReadStream(filePath);
      let fileData = Buffer.alloc(0);
      for await (const chunk of fileStream) {
        fileData = Buffer.concat([fileData, chunk]);
      }
      return { success: true, data: fileData, message: '下载成功' };
    } catch (err) {
      this.logger.error(`gRPC下载失败: ${err.message}`);
      return { success: false, message: '文件下载失败', data: Buffer.alloc(0) };
    }
  }

  // 流式下载服务方法
  async *downloadFileStreamGrpc(
    data: DownloadFileRequest,
  ): AsyncGenerator<DownloadFileChunk> {
    try {
      const filePath = data.fileMeta.filePath;
      if (!filePath) {
        yield {
          success: false,
          message: '文件路径为空',
          chunk: Buffer.alloc(0),
        };
        return;
      }

      if (!existsSync(filePath)) {
        yield { success: false, message: '文件不存在', chunk: Buffer.alloc(0) };
        return;
      }

      try {
        const chunkSize = 1024 * 1024; // 1MB chunks
        const fileStream = createReadStream(filePath, {
          highWaterMark: chunkSize,
        });

        for await (const chunk of fileStream) {
          yield { success: true, message: '下载中', chunk };
        }

        yield { success: true, message: '下载完成', chunk: Buffer.alloc(0) };
      } catch (streamError) {
        yield {
          success: false,
          message: `文件流读取错误: ${streamError.message}`,
          chunk: Buffer.alloc(0),
        };
      }
    } catch (err) {
      yield {
        success: false,
        message: `gRPC流式下载失败: ${err.message}`,
        chunk: Buffer.alloc(0),
      };
    }
  }

  async downloadFilesGrpc(
    data: DownloadFilesRequest,
  ): Promise<DownloadFilesResponse> {
    try {
      if (!data.filesMeta || data.filesMeta.length === 0) {
        return {
          success: false,
          message: '没有可下载的文件',
          data: Buffer.alloc(0),
        };
      }

      const zip = archiver('zip', {
        zlib: { level: 9 },
        store: true, // 使用存储模式，不压缩
      });

      // 使用流式处理
      const chunks: Buffer[] = [];
      let totalSize = 0;

      zip.on('data', (chunk) => {
        chunks.push(chunk);
        totalSize += chunk.length;
      });

      await new Promise<void>((resolve, reject) => {
        zip.on('end', resolve);
        zip.on('error', (err) => {
          this.logger.error(`打包错误: ${err.message}`);
          reject(err);
        });

        for (const fileMeta of data.filesMeta) {
          const filePath = fileMeta.filePath;
          if (existsSync(filePath)) {
            const stream = createReadStream(filePath);
            stream.on('error', (err) => {
              this.logger.error(`读取文件错误: ${filePath}, ${err.message}`);
              stream.destroy();
            });
            zip.append(stream, {
              name: fileMeta.originalFileName,
            });
          } else {
            this.logger.warn(`文件未找到: ${filePath}`);
          }
        }
        zip.finalize();
      });

      const zipBuffer = Buffer.concat(chunks);
      return { success: true, data: zipBuffer, message: '打包成功' };
    } catch (err) {
      this.logger.error(`gRPC打包失败: ${err.message}`);
      return { success: false, message: '文件打包失败', data: Buffer.alloc(0) };
    }
  }
}
