import { FileEntity } from '@app/database/entities';
import { RedisService } from '@app/redis';
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { getModelMimeType } from '@shared/utils';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { TaskCreateDto } from './dto/task-create.dto';
import { UploadSingleDto } from './dto/upload-single.dto';
import { pipeline } from 'stream/promises';
import { Readable, Writable } from 'stream';

export type UploadTask = TaskCreateDto & {
  taskId: string;
  uploadedChunks: number[];
};

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly chunkDir = path.join(__dirname, '../..', 'chunks');
  private readonly uploadDir = path.join(__dirname, '../..', 'uploads');
  private readonly CHUNK_SIZE = 1024 * 1024; // 1MB chunks
  private readonly MAX_LISTENERS = 50;

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {
    if (!fs.existsSync(this.chunkDir)) {
      fs.mkdirSync(this.chunkDir, { recursive: true });
      this.logger.log(`创建分片存储目录: ${this.chunkDir}`);
    }
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`创建文件上传目录: ${this.uploadDir}`);
    }
  }

  private createReadableStream(data: Buffer): Readable {
    const stream = new Readable();
    stream.push(data);
    stream.push(null);
    return stream;
  }

  private createWriteStream(filePath: string): Writable {
    const stream = fs.createWriteStream(filePath);
    stream.setMaxListeners(this.MAX_LISTENERS);
    return stream;
  }

  private async handleFileMd5(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath, {
        highWaterMark: this.CHUNK_SIZE,
      });
      stream.setMaxListeners(this.MAX_LISTENERS);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (error) => reject(error));
    });
  }

  async saveFile(
    fileMeta: UploadSingleDto['fileMeta'],
    fileData: Buffer,
    userId: number,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const fileName = Date.now() + uuidv4();
    const filePath = path.join(this.uploadDir, fileName);
    const fileType = fileMeta.mimetype
      ? fileMeta.mimetype
      : getModelMimeType(path.extname(fileMeta.originalname));

    try {
      const readable = this.createReadableStream(fileData);
      const writable = this.createWriteStream(filePath);

      await pipeline(readable, writable);
      const fileMd5 = await this.handleFileMd5(filePath);

      const found = await queryRunner.manager.findOne(FileEntity, {
        where: { fileMd5 },
      });

      let file;
      if (found) {
        file = this.fileRepository.create({
          originalFileName: fileMeta.originalname,
          storageFileName: found.storageFileName,
          filePath: found.filePath,
          fileType: found.fileType,
          fileSize: found.fileSize,
          fileMd5: found.fileMd5,
          createdBy: userId,
          updatedBy: userId,
        });
      } else {
        file = this.fileRepository.create({
          originalFileName: fileMeta.originalname,
          storageFileName: fileName,
          filePath,
          fileType,
          fileSize: fileData.length,
          fileMd5,
          createdBy: userId,
          updatedBy: userId,
        });
      }

      await queryRunner.manager.save(file);
      await queryRunner.commitTransaction();
      return {
        code: 200,
        message: '文件上传成功',
        success: true,
        data: file,
      };
    } catch (error) {
      this.logger.error(`保存文件失败: ${error.message}`);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async chunkFile(
    taskMeta: {
      taskId: string;
      chunkIndex: number;
    },
    chunkData: Buffer,
  ): Promise<{ message: string; chunkIndex: number }> {
    const { taskId, chunkIndex } = taskMeta;
    const lockKey = `upload:lock:${taskId}`;

    return await this.redisService.executeWithLock(lockKey, 5000, async () => {
      const task = await this.redisService.get<UploadTask>(
        `upload:task:${taskId}`,
      );
      if (!task) {
        throw new RpcException('上传任务不存在或已过期');
      }

      const chunkFileName = `${taskId}_chunk_${chunkIndex}`;
      const chunkFilePath = path.join(this.chunkDir, chunkFileName);

      const readable = this.createReadableStream(chunkData);
      const writable = this.createWriteStream(chunkFilePath);

      await pipeline(readable, writable);

      if (!task.uploadedChunks.includes(chunkIndex)) {
        task.uploadedChunks.push(chunkIndex);
      }
      await this.redisService.set(`upload:task:${taskId}`, task);
      return { message: '分片上传成功', chunkIndex };
    });
  }

  private async mergeChunks(
    taskId: string,
    totalChunks: number,
    finalFilePath: string,
  ): Promise<void> {
    const chunkPaths: string[] = [];
    const tempFilePath = `${finalFilePath}.temp`;
    const BATCH_SIZE = 10; // 每批处理的分片数量

    try {
      // 创建一个写入流
      const writeStream = this.createWriteStream(tempFilePath);

      // 使用 Promise 包装写入流的结束事件
      const writeStreamEnded = new Promise<void>((resolve, reject) => {
        writeStream.once('finish', resolve);
        writeStream.once('error', reject);
      });

      // 按批次处理分片
      for (
        let batchStart = 1;
        batchStart <= totalChunks;
        batchStart += BATCH_SIZE
      ) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, totalChunks);

        // 处理当前批次的所有分片
        await Promise.all(
          Array.from({ length: batchEnd - batchStart + 1 }, (_, i) => {
            const chunkIndex = batchStart + i;
            const chunkFileName = `${taskId}_chunk_${chunkIndex}`;
            const chunkFilePath = path.join(this.chunkDir, chunkFileName);

            if (!fs.existsSync(chunkFilePath)) {
              throw new RpcException(`缺失分片文件: ${chunkFileName}`);
            }

            chunkPaths.push(chunkFilePath);

            // 读取分片并写入
            const readStream = fs.createReadStream(chunkFilePath, {
              highWaterMark: this.CHUNK_SIZE,
            });
            readStream.setMaxListeners(this.MAX_LISTENERS);

            return new Promise<void>((resolve, reject) => {
              readStream.pipe(writeStream, { end: false });
              readStream.once('end', resolve);
              readStream.once('error', reject);
            });
          }),
        );
      }

      // 关闭写入流
      writeStream.end();
      // 等待写入流完全结束
      await writeStreamEnded;

      // 将临时文件重命名为最终文件
      await fs.promises.rename(tempFilePath, finalFilePath);

      // 清理分片文件
      await Promise.all(chunkPaths.map((path) => fs.promises.unlink(path)));
    } catch (error) {
      // 清理临时文件和分片文件
      await Promise.all([
        fs.promises.unlink(tempFilePath).catch(() => {}),
        ...chunkPaths.map((path) => fs.promises.unlink(path).catch(() => {})),
      ]);
      throw error;
    }
  }

  async completeUpload(taskId: string) {
    const task = await this.redisService.get<UploadTask>(
      `upload:task:${taskId}`,
    );
    if (!task) {
      throw new RpcException('上传任务不存在或已过期');
    }
    if (task.uploadedChunks.length !== task.totalChunks) {
      throw new RpcException('尚未接收到所有分片，无法合并文件');
    }

    task.uploadedChunks.sort((a, b) => a - b);
    const finalFileName = Date.now() + uuidv4();
    const finalFilePath = path.join(this.uploadDir, finalFileName);

    try {
      await this.mergeChunks(taskId, task.totalChunks, finalFilePath);

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const found = await queryRunner.manager.findOne(FileEntity, {
          where: { fileMd5: task.fileMd5 },
        });

        let fileEntity;
        if (found) {
          fileEntity = this.fileRepository.create({
            originalFileName: task.fileName,
            storageFileName: found.storageFileName,
            filePath: found.filePath,
            fileType: found.fileType,
            fileSize: task.fileSize,
            fileMd5: found.fileMd5,
            createdBy: task.userId,
            updatedBy: task.userId,
          });
        } else {
          fileEntity = this.fileRepository.create({
            originalFileName: task.fileName,
            storageFileName: finalFileName,
            filePath: finalFilePath,
            fileType: task.fileType,
            fileSize: task.fileSize,
            fileMd5: task.fileMd5,
            createdBy: task.userId,
            updatedBy: task.userId,
          });
        }

        await queryRunner.manager.save(fileEntity);
        await queryRunner.commitTransaction();
        await this.redisService.del(`upload:task:${taskId}`);
        return {
          code: 200,
          message: '文件合并成功',
          success: true,
          data: fileEntity,
        };
      } catch (error) {
        await queryRunner.rollbackTransaction();
        this.logger.error(`合并文件失败: ${error.message}`);
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      if (fs.existsSync(finalFilePath)) {
        await fs.promises.unlink(finalFilePath);
      }
      throw error;
    }
  }

  //———————————————————————————————————————
  // 创建上传任务：基于 CreateTaskDto 的属性生成任务，并缓存至 Redis
  async createTask(taskMeta: TaskCreateDto): Promise<UploadTask> {
    const taskId = crypto.randomBytes(16).toString('hex');
    const task: UploadTask = {
      taskId,
      userId: taskMeta.userId,
      fileName: taskMeta.fileName,
      fileSize: taskMeta.fileSize,
      fileType: taskMeta.fileType,
      fileMd5: taskMeta.fileMd5,
      totalChunks: taskMeta.totalChunks,
      uploadedChunks: [],
    };
    await this.redisService.set(`upload:task:${taskId}`, task);
    return task;
  }

  //———————————————————————————————————————
  // 获取上传任务信息：从 Redis 中检索任务详情
  async getTask(taskId: string) {
    const task = await this.redisService.get<UploadTask>(
      `upload:task:${taskId}`,
    );
    if (!task) {
      throw new RpcException('上传任务不存在或已过期');
    }
    return {
      code: 200,
      message: '获取任务成功',
      success: true,
      data: task,
    };
  }

  //———————————————————————————————————————
  // 预载文件：如果文件存在则直接保存文件元数据
  async preloadFile(fileMd5: string, originalFileName: string, userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const found = await queryRunner.manager.findOne(FileEntity, {
        where: { fileMd5 },
      });
      if (!found) {
        return {
          code: 404,
          message: '文件不存在',
          success: false,
          data: null,
        };
      }
      const file = this.fileRepository.create({
        originalFileName,
        storageFileName: found.storageFileName,
        filePath: found.filePath,
        fileType: found.fileType,
        fileMd5: found.fileMd5,
        fileSize: found.fileSize,
        createdBy: userId,
        updatedBy: userId,
      });
      await queryRunner.manager.save(file);
      await queryRunner.commitTransaction();
      return {
        code: 200,
        message: '文件预加载成功',
        success: true,
        data: file,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`保存文件元数据失败: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
