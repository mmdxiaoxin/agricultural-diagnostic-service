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

export type UploadTask = TaskCreateDto & {
  taskId: string;
  uploadedChunks: number[];
};

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  // 用于临时存储分片的目录
  private chunkDir = path.join(__dirname, '../..', 'chunks');
  // 用于保存最终文件的目录
  private uploadDir = path.join(__dirname, '../..', 'uploads');

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {
    // 确保必要的存储目录存在
    if (!fs.existsSync(this.chunkDir)) {
      fs.mkdirSync(this.chunkDir, { recursive: true });
      this.logger.log(`创建分片存储目录: ${this.chunkDir}`);
    }
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`创建文件上传目录: ${this.uploadDir}`);
    }
  }

  private handleFileMd5 = (filePath: string) =>
    new Promise<string>((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (error) => reject(error));
    });

  //———————————————————————————————————————
  // 单文件上传：直接保存文件数据并更新数据库记录
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
    // 将文件数据写入目标目录
    await fs.promises.writeFile(filePath, fileData);
    const fileMd5 = await this.handleFileMd5(filePath);
    try {
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
  // 分片上传：写入单个分片，并更新 Redis 中的任务状态
  async chunkFile(
    taskMeta: {
      taskId: string;
      chunkIndex: number;
      totalChunks: number;
    },
    chunkData: Buffer,
  ): Promise<{ message: string; chunkIndex: number }> {
    const { taskId, chunkIndex } = taskMeta;
    // 使用 Redis 锁确保在并发情况下对任务状态的修改不会冲突
    const lockKey = `upload:lock:${taskId}`;
    // 此处设置锁的有效期为 5000 毫秒，可根据业务需要调整
    return await this.redisService.executeWithLock(lockKey, 5000, async () => {
      // 再次从 Redis 中获取上传任务信息，确保在锁保护下获得最新状态
      const task = await this.redisService.get<UploadTask>(
        `upload:task:${taskId}`,
      );
      if (!task) {
        throw new RpcException('上传任务不存在或已过期');
      }
      // 构造分片文件名并写入临时目录
      const chunkFileName = `${taskId}_chunk_${chunkIndex}`;
      const chunkFilePath = path.join(this.chunkDir, chunkFileName);
      await fs.promises.writeFile(chunkFilePath, chunkData);
      // 更新任务记录，确保每个分片只记录一次
      if (!task.uploadedChunks.includes(chunkIndex)) {
        task.uploadedChunks.push(chunkIndex);
      }
      // 将更新后的任务重新存入 Redis
      await this.redisService.set(`upload:task:${taskId}`, task);
      return { message: '分片上传成功', chunkIndex };
    });
  }

  //———————————————————————————————————————
  // 合并文件：当所有分片上传完毕后，按顺序合并文件，并保存数据库记录
  async completeUpload(taskId: string) {
    const task = await this.redisService.get<UploadTask>(
      `upload:task:${taskId}`,
    );
    if (!task) {
      throw new RpcException('上传任务不存在或已过期');
    }
    if (task.uploadedChunks.length !== task.totalChunks) {
      console.log('task', task.uploadedChunks.length, task.totalChunks);
      throw new RpcException('尚未接收到所有分片，无法合并文件');
    }
    // 对分片索引排序，确保正确合并顺序
    task.uploadedChunks.sort((a, b) => a - b);
    const finalFileName = Date.now() + uuidv4();
    const finalFilePath = path.join(this.uploadDir, finalFileName);
    const writeStream = fs.createWriteStream(finalFilePath);
    for (let i = 1; i <= task.totalChunks; i++) {
      const chunkFileName = `${taskId}_chunk_${i}`;
      const chunkFilePath = path.join(this.chunkDir, chunkFileName);
      if (!fs.existsSync(chunkFilePath)) {
        throw new RpcException(`缺失分片文件: ${chunkFileName}`);
      }
      const chunkData = await fs.promises.readFile(chunkFilePath);
      writeStream.write(chunkData);
      // 合并后清理临时分片
      await fs.promises.unlink(chunkFilePath);
    }
    writeStream.end();
    await new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(true));
      writeStream.on('error', reject);
    });
    // 开启数据库事务，确保写入操作的原子性
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
      // 合并成功后，清理 Redis 中的任务缓存
      await this.redisService.del(`upload:task:${taskId}`);
      return { success: true, file: fileEntity };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`合并文件失败: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
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
