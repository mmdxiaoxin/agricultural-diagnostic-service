import { File as FileEntity, Task as TaskEntity } from '@app/database/entities';
import { CreateTaskDto } from '@common/dto/file/create-task.dto';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { getModelMimeType } from '@shared/utils';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  // 用于临时存储分片数据的目录
  private chunkDir = path.join(__dirname, '..', 'chunks');
  // 用于保存最终上传文件的目录
  private uploadDir = path.join(__dirname, '..', 'uploads');

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,

    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,

    private readonly dataSource: DataSource,
  ) {
    // 初始化文件存储目录，确保目录存在
    if (!fs.existsSync(this.chunkDir)) {
      fs.mkdirSync(this.chunkDir, { recursive: true });
      this.logger.log(`创建分片存储目录: ${this.chunkDir}`);
    }
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`创建文件上传目录: ${this.uploadDir}`);
    }
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

  // 处理单文件上传，直接将文件数据写入目标目录
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
    const fileMd5 = await this.handleFileMd5(filePath);
    try {
      const found = await queryRunner.manager.findOne(FileEntity, {
        where: { fileMd5 },
      });
      if (found) {
        const file = this.fileRepository.create({
          originalFileName: fileMeta.originalname,
          storageFileName: found.storageFileName,
          filePath: found.filePath,
          fileType: found.fileType,
          fileMd5: found.fileMd5,
          createdBy: userId,
          updatedBy: userId,
        });
        this.logger.log(`文件已存在: ${found.id}`);
        await queryRunner.manager.save(file);
        await queryRunner.commitTransaction();
        this.logger.log(`成功保存文件: ${filePath}`);
        return { success: true, file };
      } else {
        await fs.promises.writeFile(filePath, fileData);
        const file = this.fileRepository.create({
          originalFileName: fileMeta.originalname,
          storageFileName: fileMeta.filename,
          filePath,
          fileType,
          fileMd5,
          createdBy: userId,
          updatedBy: userId,
        });
        await queryRunner.manager.save(file);
        await queryRunner.commitTransaction();
        this.logger.log(`成功保存文件: ${filePath}`);
        return { success: true, file };
      }
    } catch (error) {
      this.logger.error(`保存文件失败: ${error.message}`);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 保存分片文件，依据上传时传入的元数据构造唯一标识
  async chunkFile(chunkMeta: Express.Multer.File, chunkData: Buffer) {
    // 假设 chunkMeta 内含 fileId 与 chunkIndex 信息，如不存在则作默认处理
    const fileId = (chunkMeta as any).fileId || chunkMeta.originalname;
    const chunkIndex = (chunkMeta as any).chunkIndex ?? Date.now();
    const chunkFileName = `${fileId}.part-${chunkIndex}`;
    const chunkFilePath = path.join(this.chunkDir, chunkFileName);

    try {
      await fs.promises.writeFile(chunkFilePath, chunkData);
      this.logger.log(`成功保存分片: ${chunkFilePath}`);
      return { success: true, chunkFilePath };
    } catch (error) {
      this.logger.error(`保存分片失败: ${error.message}`);
      throw error;
    }
  }

  // 完成分片上传，将所有分片按顺序拼接成完整文件
  async completeFile(data: { fileName: string; totalChunks: number }) {
    const { fileName, totalChunks } = data;
    const finalFilePath = path.join(this.uploadDir, fileName);

    try {
      const writeStream = fs.createWriteStream(finalFilePath);
      for (let i = 0; i < totalChunks; i++) {
        const chunkFileName = `${fileName}.part-${i}`;
        const chunkFilePath = path.join(this.chunkDir, chunkFileName);
        if (!fs.existsSync(chunkFilePath)) {
          throw new Error(`缺失分片文件: ${chunkFilePath}`);
        }
        const chunkData = await fs.promises.readFile(chunkFilePath);
        writeStream.write(chunkData);
        // 写入成功后删除分片文件以节省空间
        await fs.promises.unlink(chunkFilePath);
        this.logger.log(`处理完毕分片: ${chunkFilePath}`);
      }
      writeStream.end();
      this.logger.log(`文件重组成功: ${finalFilePath}`);
      return { success: true, finalFilePath };
    } catch (error) {
      this.logger.error(`文件重组失败: ${error.message}`);
      throw error;
    }
  }

  // 创建任务：检查任务是否已存在后再进行创建
  async createTask(userId: number, taskMeta: CreateTaskDto) {
    const { fileName, fileSize, fileType, fileMd5, totalChunks } = taskMeta;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 查找已有文件
      const file = await queryRunner.manager.findOne(FileEntity, {
        where: { fileMd5 },
      });

      if (file) {
        // 若找到重复文件，创建文件记录和任务记录，任务状态为 completed
        const newFile = this.fileRepository.create({
          originalFileName: fileName,
          storageFileName: file.storageFileName,
          filePath: file.filePath,
          fileSize: file.fileSize,
          fileType: file.fileType,
          fileMd5: file.fileMd5,
          createdBy: userId,
          updatedBy: userId,
          version: 1,
        });

        await queryRunner.manager.save(FileEntity, newFile);

        // 创建任务记录，状态为 completed
        const task = queryRunner.manager.create(TaskEntity, {
          fileName: fileName,
          fileSize: file.fileSize, // 复制已有文件的大小
          fileType: file.fileType, // 使用已上传文件的类型
          fileMd5: fileMd5,
          totalChunks: totalChunks,
          uploadedChunks: totalChunks,
          status: 'completed',
          createdBy: userId,
          updatedBy: userId,
          version: 1,
        });
        await queryRunner.manager.save(task);

        await queryRunner.commitTransaction();

        return {
          success: true,
          result: { fileId: file.id, status: 'completed' },
          completed: true,
        };
      }

      // 文件不存在，创建任务并设置状态为 uploading
      const task = queryRunner.manager.create(TaskEntity, {
        fileName: fileName,
        fileSize: fileSize,
        fileType: fileType,
        fileMd5: fileMd5,
        totalChunks: totalChunks,
        uploadedChunks: 0,
        status: 'uploading',
        createdBy: userId,
        updatedBy: userId,
        version: 1,
      });
      await queryRunner.manager.save(task);

      await queryRunner.commitTransaction();

      return {
        success: true,
        result: { taskId: task.id, status: 'uploading' },
        completed: false,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 获取任务：依据任务标识返回任务详细信息
  async getTask(taskId: number) {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
    });
    if (!task) {
      throw new RpcException({
        code: HttpStatus.NOT_FOUND,
        message: `任务 ${taskId} 不存在`,
      });
    }
    return {
      success: true,
      result: {
        taskId: task.id,
        status: task.status,
        chunkStatus: task.chunkStatus,
        totalChunks: task.totalChunks,
        uploadedChunks: task.uploadedChunks,
      },
    };
  }
}
