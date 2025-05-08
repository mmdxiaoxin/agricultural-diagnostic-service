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

  private async handleFileMd5(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath, {
        highWaterMark: this.CHUNK_SIZE,
      });

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
      // 使用流式写入
      await pipeline(async function* () {
        yield fileData;
      }, fs.createWriteStream(filePath));

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
      return { success: true, result: file };
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

      // 使用流式写入
      await pipeline(async function* () {
        yield chunkData;
      }, fs.createWriteStream(chunkFilePath));

      if (!task.uploadedChunks.includes(chunkIndex)) {
        task.uploadedChunks.push(chunkIndex);
      }
      await this.redisService.set(`upload:task:${taskId}`, task);
      return { message: '分片上传成功', chunkIndex };
    });
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
    const writeStream = fs.createWriteStream(finalFilePath);

    try {
      // 使用流式合并
      for (let i = 1; i <= task.totalChunks; i++) {
        const chunkFileName = `${taskId}_chunk_${i}`;
        const chunkFilePath = path.join(this.chunkDir, chunkFileName);

        if (!fs.existsSync(chunkFilePath)) {
          throw new RpcException(`缺失分片文件: ${chunkFileName}`);
        }

        await pipeline(
          fs.createReadStream(chunkFilePath, {
            highWaterMark: this.CHUNK_SIZE,
          }),
          writeStream,
          { end: false },
        );

        // 合并后立即删除分片
        await fs.promises.unlink(chunkFilePath);
      }

      writeStream.end();
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
      });

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
        return { success: true, file: fileEntity };
      } catch (error) {
        await queryRunner.rollbackTransaction();
        this.logger.error(`合并文件失败: ${error.message}`);
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      // 清理临时文件
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
    return { success: true, result: task };
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
        return { success: false, result: null };
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
      return { success: true, result: file };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`保存文件元数据失败: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
