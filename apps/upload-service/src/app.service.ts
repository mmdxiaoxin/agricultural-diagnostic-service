import { File as FileEntity } from '@app/database/entities';
import { RedisService } from '@app/redis';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getModelMimeType } from '@shared/utils';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource, Repository } from 'typeorm';

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
  // 用于临时存储分片的目录
  private chunkDir = path.join(__dirname, '..', 'chunks');
  // 用于保存最终文件的目录
  private uploadDir = path.join(__dirname, '..', 'uploads');

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

  private handleFileType = (file: Express.Multer.File) =>
    file.mimetype
      ? file.mimetype
      : getModelMimeType(path.extname(file.originalname));

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
  // 分片上传：写入单个分片，并更新 Redis 中的任务状态
  async handleChunk(
    chunkMeta: Express.Multer.File & {
      taskId: string;
      chunkIndex: number;
      totalChunks: number;
    },
    chunkData: Buffer,
  ) {
    const { taskId, chunkIndex, totalChunks } = chunkMeta;
    // 从 Redis 中获取对应上传任务信息
    const task = await this.redisService.get<UploadTask>(
      `upload:task:${taskId}`,
    );
    if (!task) {
      throw new Error('上传任务不存在或已过期');
    }
    // 以任务ID和分片索引命名存储分片
    const chunkFileName = `${taskId}_chunk_${chunkIndex}`;
    const chunkFilePath = path.join(this.chunkDir, chunkFileName);
    await fs.promises.writeFile(chunkFilePath, chunkData);
    this.logger.log(`成功保存分片: ${chunkFileName}`);
    // 更新任务记录，避免重复分片上传
    if (!task.uploadedChunks.includes(chunkIndex)) {
      task.uploadedChunks.push(chunkIndex);
    }
    if (!task.totalChunks && totalChunks) {
      task.totalChunks = totalChunks;
    }
    // 将更新后的任务数据重新存入 Redis
    await this.redisService.set(`upload:task:${taskId}`, JSON.stringify(task));
    return { message: '分片上传成功', chunkIndex };
  }
  //———————————————————————————————————————
  // 合并文件：在所有分片接收完成后合并文件，并保存数据库记录
  async completeUpload(taskId: string) {
    const task = await this.redisService.get<UploadTask>(
      `upload:task:${taskId}`,
    );
    if (!task) {
      throw new Error('上传任务不存在或已过期');
    }
    if (task.uploadedChunks.length !== task.totalChunks) {
      throw new Error('尚未接收到所有分片，无法合并文件');
    }
    // 对分片索引排序以确保正确的文件顺序
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
      await fs.promises.unlink(chunkFilePath);
      this.logger.log(`删除分片文件: ${chunkFileName}`);
    }
    writeStream.end();
    await new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(true));
      writeStream.on('error', reject);
    });
    this.logger.log(`文件合并完成: ${finalFilePath}`);
    const fileMd5 = await this.handleFileMd5(finalFilePath);
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
      // 合并成功后清理 Redis 中的任务缓存
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
  // 创建上传任务：生成唯一任务ID，并缓存任务初始数据至 Redis
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
    await this.redisService.set(`upload:task:${taskId}`, JSON.stringify(task));
    this.logger.log(`创建上传任务: ${taskId}`);
    return task;
  }
  //———————————————————————————————————————
  // 获取上传任务信息：从 Redis 中检索任务详情
  async getTask(taskId: string) {
    const taskStr = await this.redisService.get<string>(
      `upload:task:${taskId}`,
    );
    if (!taskStr) {
      throw new Error('上传任务不存在或已过期');
    }
    return JSON.parse(taskStr);
  }
}
