import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import * as crypto from 'crypto';
import { createReadStream, createWriteStream } from 'fs';
import {
  access,
  constants,
  mkdir,
  readFile,
  rename,
  unlink,
} from 'fs/promises';
import * as path from 'path';

@Injectable()
export class FileOperationService {
  private readonly logger = new Logger(FileOperationService.name);

  /**
   * 确保目录存在
   * @param dirPath 目标目录
   */
  async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new RpcException({ message: `无法创建目录: ${dirPath}`, error });
    }
  }

  /**
   * 读取文件（确保路径安全）
   * @param filePath 目标文件路径
   * @returns 文件内容（Buffer）
   */
  async readFile(filePath: string): Promise<Buffer> {
    try {
      this.validatePath(filePath);
      await this.checkFileExists(filePath);
      return await readFile(filePath);
    } catch (error) {
      throw new RpcException({ message: '读取文件失败', error });
    }
  }

  /**
   * 删除文件（确保路径安全）
   * @param filePath 目标文件路径
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      // 验证路径安全性
      this.validatePath(filePath);
      // 检查文件是否存在
      await this.checkFileExists(filePath);
      // 检查文件权限
      await this.checkFilePermissions(filePath);
      // 尝试删除文件
      await unlink(filePath);
    } catch (error) {
      this.logger.error(`文件删除失败: ${filePath}`, error);

      if (error instanceof NotFoundException) {
        throw new RpcException({
          code: HttpStatus.NOT_FOUND,
          message: `文件不存在: ${filePath}`,
        });
      }

      if (error.code === 'EACCES') {
        throw new RpcException({
          code: HttpStatus.FORBIDDEN,
          message: `没有权限删除文件: ${filePath}`,
        });
      }

      if (error.code === 'EBUSY') {
        throw new RpcException({
          code: HttpStatus.CONFLICT,
          message: `文件正在被使用: ${filePath}`,
        });
      }

      throw new RpcException({
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `删除文件失败: ${error.message}`,
      });
    }
  }

  /**
   * 计算文件 MD5 值（流式计算，提高大文件效率）
   * @param filePath 目标文件路径
   * @returns 文件的 MD5 值
   */
  async calculateFileMd5(filePath: string): Promise<string> {
    try {
      this.validatePath(filePath);
      await this.checkFileExists(filePath);
      const hash = crypto.createHash('md5');
      const stream = createReadStream(filePath);

      return await new Promise<string>((resolve, reject) => {
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', (error) =>
          reject(new RpcException({ message: '读取文件时出错', error })),
        );
      });
    } catch (error) {
      throw new RpcException({ message: '无法计算文件 MD5', error });
    }
  }

  /**
   * 合并单个文件
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

  /**
   * 合并多个文件（支持大文件合并）
   * @param chunkPaths 需要合并的文件路径数组
   * @param finalPath 合并后的文件路径
   */
  async mergeFiles(chunkPaths: string[], finalPath: string): Promise<void> {
    try {
      this.validatePath(finalPath);
      const writeStream = createWriteStream(finalPath, { flags: 'w' });

      for (const chunkPath of chunkPaths) {
        this.validatePath(chunkPath);
        await this.checkFileExists(chunkPath);
        const readStream = createReadStream(chunkPath);

        await new Promise<void>((resolve, reject) => {
          readStream.pipe(writeStream, { end: false });
          readStream.on('end', resolve);
          readStream.on('error', reject);
        });
      }

      writeStream.end();
    } catch (error) {
      throw new RpcException({ message: '合并文件失败', error });
    }
  }

  /**
   * 移动文件（带路径检查）
   * @param oldPath 旧路径
   * @param newPath 新路径
   */
  async moveFile(oldPath: string, newPath: string): Promise<void> {
    try {
      this.validatePath(oldPath);
      this.validatePath(newPath);
      await this.checkFileExists(oldPath);
      await rename(oldPath, newPath);
    } catch (error) {
      throw new RpcException({ message: '移动文件失败', error });
    }
  }

  /**
   * 校验路径是否合法（防止路径遍历攻击）
   * @param filePath 目标路径
   */
  private validatePath(filePath: string): void {
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(path.resolve('./'))) {
      throw new RpcException({ message: '非法路径访问' });
    }
  }

  /**
   * 检查文件权限
   * @param filePath 目标文件路径
   */
  private async checkFilePermissions(filePath: string): Promise<void> {
    try {
      await access(filePath, constants.W_OK);
    } catch {
      throw new RpcException({
        code: HttpStatus.FORBIDDEN,
        message: `没有文件写入权限: ${filePath}`,
      });
    }
  }

  /**
   * 检查文件是否存在（防止文件不存在时的操作）
   * @param filePath 目标文件路径
   */
  private async checkFileExists(filePath: string): Promise<void> {
    try {
      await access(filePath, constants.F_OK | constants.R_OK);
    } catch {
      throw new NotFoundException({
        message: `文件不存在或无法访问: ${filePath}`,
      });
    }
  }
}
