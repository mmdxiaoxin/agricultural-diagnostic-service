import { File as FileEntity } from '@app/database/entities';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getModelMimeType } from '@shared/utils';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource, Repository } from 'typeorm';
import * as Redis from 'ioredis';

interface UploadTask {
  taskId: string;
  userId: number;
  fileName: string;
  totalChunks: number;
  uploadedChunks: number[];
  fileMeta?: any;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  // 临时存储分片数据的目录
  private chunkDir = path.join(__dirname, '..', 'chunks');
  // 最终文件存放的目录
  private uploadDir = path.join(__dirname, '..', 'uploads');
  // Redis 客户端实例，用于缓存上传任务
  private readonly redisClient: Redis.Redis;

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly dataSource: DataSource,
  ) {
    // 确保分片与文件存储目录存在
    if (!fs.existsSync(this.chunkDir)) {
      fs.mkdirSync(this.chunkDir, { recursive: true });
      this.logger.log(`创建分片存储目录: ${this.chunkDir}`);
    }
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`创建文件上传目录: ${this.uploadDir}`);
    }
    // 实例化 Redis 客户端（使用默认配置）
    this.redisClient = new Redis();
  }

  private handleFileType = (file: Express.Multer.File) => {
    return file.mimetype
      ? file.mimetype
      : getModelMimeType(path.extname(file.originalname));
  };

  private handleFileMd5 = (filePath: string) => {
    return new Promise<string>((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', (error) => reject(error));
    });
  };

  //———————————————————————————————————————
  // 单文件上传：直接保存文件数据，并同步数据库记录
  async saveFile(
    fileMeta: Express.Multer.File,
    fileData: Buffer,
    userId: number,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const filePath = path.join(this.uploadDir, fileMeta.filename);
    const fileType = this.handleFileType(fileMeta);
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
          fileMd5: found.fileMd5,
          createdBy: userId,
          updatedBy: userId,
        });
        this.logger.log(`文件已存在: ${found.id}`);
      } else {
        file = this.fileRepository.create({
          originalFileName: fileMeta.originalname,
          storageFileName: fileMeta.filename,
          filePath,
          fileType,
          fileMd5,
          createdBy: userId,
          updatedBy: userId,
        });
      }
      await queryRunner.manager.save(file);
      await queryRunner.commitTransaction();
      this.logger.log(`成功保存文件: ${filePath}`);
      return { success: true, file };
    } catch (error) {
      this.logger.error(`保存文件失败: ${error.message}`);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  //———————————————————————————————————————
  // 分片上传：处理单个分片的写入，并更新 Redis 中的任务状态
  async handleChunk(
    chunkMeta: Express.Multer.File & {
      taskId: string;
      chunkIndex: number;
      totalChunks: number;
    },
    chunkData: Buffer,
  ) {
    const { taskId, chunkIndex, totalChunks } = chunkMeta;
    // 从 Redis 中检索对应的上传任务
    const taskStr = await this.redisClient.get(`upload:task:${taskId}`);
    if (!taskStr) {
      throw new Error('上传任务不存在或已过期');
    }
    const task: UploadTask = JSON.parse(taskStr);
    // 将当前分片数据写入临时目录，文件名由任务 ID 与分片索引构成
    const chunkFileName = `${taskId}_chunk_${chunkIndex}`;
    const chunkFilePath = path.join(this.chunkDir, chunkFileName);
    await fs.promises.writeFile(chunkFilePath, chunkData);
    this.logger.log(`成功保存分片: ${chunkFileName}`);
    // 更新任务记录：将本次分片索引加入已上传列表（防止重复）
    if (!task.uploadedChunks.includes(chunkIndex)) {
      task.uploadedChunks.push(chunkIndex);
    }
    // 如任务中未设置总分片数，则利用本次传递的参数更新
    if (!task.totalChunks && totalChunks) {
      task.totalChunks = totalChunks;
    }
    // 将更新后的任务数据重新写回 Redis
    await this.redisClient.set(`upload:task:${taskId}`, JSON.stringify(task));
    return { message: '分片上传成功', chunkIndex };
  }
  //———————————————————————————————————————
  // 合并文件：在所有分片接收完成后，将分片顺序合并为最终文件，
  // 同时计算 MD5 并保存至数据库，最后清理缓存任务
  async completeUpload(taskId: string) {
    const taskStr = await this.redisClient.get(`upload:task:${taskId}`);
    if (!taskStr) {
      throw new Error('上传任务不存在或已过期');
    }
    const task: UploadTask = JSON.parse(taskStr);
    if (task.uploadedChunks.length !== task.totalChunks) {
      throw new Error('尚未接收到所有分片，无法合并文件');
    }
    // 对分片索引进行排序，确保文件数据按正确顺序合并
    task.uploadedChunks.sort((a, b) => a - b);
    const finalFilePath = path.join(this.uploadDir, task.fileName);
    const writeStream = fs.createWriteStream(finalFilePath);
    for (let i = 0; i < task.totalChunks; i++) {
      const chunkFileName = `${taskId}_chunk_${i}`;
      const chunkFilePath = path.join(this.chunkDir, chunkFileName);
      if (!fs.existsSync(chunkFilePath)) {
        throw new Error(`缺失分片文件: ${chunkFileName}`);
      }
      const chunkData = await fs.promises.readFile(chunkFilePath);
      writeStream.write(chunkData);
      // 写入完成后清理临时分片文件
      await fs.promises.unlink(chunkFilePath);
      this.logger.log(`删除分片文件: ${chunkFileName}`);
    }
    writeStream.end();
    // 等待文件写入流完全结束
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
    this.logger.log(`文件合并完成: ${finalFilePath}`);
    // 计算合并后文件的 MD5 值，以便进一步比对和校验
    const fileMd5 = await this.handleFileMd5(finalFilePath);
    // 使用数据库事务处理，确保文件记录写入的原子性
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const found = await queryRunner.manager.findOne(FileEntity, {
        where: { fileMd5 },
      });
      let fileEntity;
      if (found) {
        fileEntity = this.fileRepository.create({
          originalFileName: task.fileMeta?.originalname || task.fileName,
          storageFileName: found.storageFileName,
          filePath: found.filePath,
          fileType: found.fileType,
          fileMd5: found.fileMd5,
          createdBy: task.userId,
          updatedBy: task.userId,
        });
        this.logger.log(`文件已存在: ${found.id}`);
      } else {
        const fileType = task.fileMeta?.mimetype
          ? task.fileMeta.mimetype
          : getModelMimeType(
              path.extname(task.fileMeta?.originalname || task.fileName),
            );
        fileEntity = this.fileRepository.create({
          originalFileName: task.fileMeta?.originalname || task.fileName,
          storageFileName: task.fileName,
          filePath: finalFilePath,
          fileType,
          fileMd5,
          createdBy: task.userId,
          updatedBy: task.userId,
        });
      }
      await queryRunner.manager.save(fileEntity);
      await queryRunner.commitTransaction();
      // 合并成功后，从 Redis 中删除对应的任务缓存
      await this.redisClient.del(`upload:task:${taskId}`);
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
  // 创建上传任务：生成唯一任务 ID，并将任务初始信息缓存至 Redis
  async createTask(taskData: {
    userId: number;
    fileName: string;
    totalChunks: number;
    fileMeta?: any;
  }) {
    const taskId = crypto.randomBytes(16).toString('hex');
    const task: UploadTask = {
      taskId,
      userId: taskData.userId,
      fileName: taskData.fileName,
      totalChunks: taskData.totalChunks,
      uploadedChunks: [],
      fileMeta: taskData.fileMeta || {},
    };
    await this.redisClient.set(`upload:task:${taskId}`, JSON.stringify(task));
    this.logger.log(`创建上传任务: ${taskId}`);
    return task;
  }
  //———————————————————————————————————————
  // 获取上传任务信息：从 Redis 中检索任务详情
  async getTask(taskId: string) {
    const taskStr = await this.redisClient.get(`upload:task:${taskId}`);
    if (!taskStr) {
      throw new Error('上传任务不存在或已过期');
    }
    return JSON.parse(taskStr);
  }
}
