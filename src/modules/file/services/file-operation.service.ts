import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createReadStream, createWriteStream } from 'fs';
import { readFile, unlink } from 'fs/promises';

@Injectable()
export class FileOperationService {
  /**
   * 读取文件
   * @param filePath
   * @returns
   */
  async readFile(filePath: string): Promise<Buffer> {
    try {
      return await readFile(filePath);
    } catch (error) {
      throw new InternalServerErrorException('读取文件失败', error);
    }
  }

  /**
   * 删除文件
   * @param filePath
   * @returns
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await unlink(filePath);
    } catch (error) {
      throw new InternalServerErrorException('删除文件失败', error);
    }
  }

  /**
   * 合并文件
   * @param chunkPath
   * @param finalPath
   * @returns
   */
  mergeFile(chunkPath: string, finalPath: string) {
    return new Promise<void>((resolve, reject) => {
      const chunkStream = createReadStream(chunkPath);
      const writeStream = createWriteStream(finalPath, { flags: 'a' }); // 追加模式
      chunkStream.pipe(writeStream, { end: false }); // 不结束流
      chunkStream.on('end', resolve);
      chunkStream.on('error', reject);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  }
}
