import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
}
