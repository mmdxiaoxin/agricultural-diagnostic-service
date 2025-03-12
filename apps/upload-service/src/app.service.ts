import { File as FileEntity, Task as TaskEntity } from '@app/database/entities';
import { FileOperationService } from '@app/file-operation';
import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { getModelMimeType } from '@shared/utils';
import { CreateTaskDto } from 'apps/api-gateway/src/modules/file/dto/create-task.dto';
import {
  UpdateFileDto,
  UpdateFilesAccessDto,
} from 'apps/api-gateway/src/modules/file/dto/update-file.dto';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource, In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,

    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,

    private readonly fileOperationService: FileOperationService,

    private readonly dataSource: DataSource,
  ) {}

  // 计算文件 MD5 并查找重复文件
  private async checkRepeated(file: Express.Multer.File) {
    const fileBuffer = await this.fileOperationService.readFile(file.path);
    const fileMd5 = crypto.createHash('md5').update(fileBuffer).digest('hex');
    const result = await this.fileRepository.findOne({
      where: { fileMd5 },
    });
    return { result, fileMd5 };
  }

  // 获取文件类型
  private checkFileType(file: Express.Multer.File): string {
    return file.mimetype
      ? file.mimetype
      : getModelMimeType(path.extname(file.originalname));
  }

  // 创建文件元数据
  private async createFile(
    user_id: number,
    fileData: any,
  ): Promise<FileEntity> {
    const fileMeta = this.fileRepository.create({
      originalFileName: fileData?.originalname || fileData.originalFileName,
      storageFileName: fileData?.filename || fileData.storageFileName,
      filePath: fileData?.path || fileData.filePath,
      fileSize: fileData?.size || fileData.fileSize,
      fileType: fileData.fileType,
      fileMd5: fileData.fileMd5,
      createdBy: user_id,
      updatedBy: user_id,
      version: 1,
    });
    return await this.fileRepository.save(fileMeta);
  }

  async updateFile(userId: number, dto: UpdateFileDto) {
    const { fileId, ...fileMeta } = dto;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const file = await this.fileRepository.findOne({
        where: { id: fileId },
      });
      if (!file) {
        throw new RpcException({
          message: '未找到文件',
          code: HttpStatus.NOT_FOUND,
        });
      }
      if (file.createdBy !== userId) {
        throw new RpcException({
          message: '无权修改他人文件',
          code: HttpStatus.FORBIDDEN,
        });
      }
      Object.assign(file, fileMeta);
      file.updatedBy = userId;
      file.version += 1;
      await queryRunner.manager.save(file);
      await queryRunner.commitTransaction();
      return null; // 直接返回数据，这里返回 null 表示无需返回内容
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateFilesAccess(userId: number, dto: UpdateFilesAccessDto) {
    const { fileIds, access } = dto;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const files = await queryRunner.manager.find(FileEntity, {
        where: { id: In(fileIds) },
      });
      if (files.length === 0) {
        throw new RpcException({
          message: '未找到文件',
          code: HttpStatus.NOT_FOUND,
        });
      }
      for (const file of files) {
        if (file.createdBy !== userId) {
          throw new RpcException({
            message: '无权修改他人文件',
            code: HttpStatus.FORBIDDEN,
          });
        }
        file.access = access;
        file.updatedBy = userId;
        file.version += 1;
      }
      await queryRunner.manager.save(files);
      await queryRunner.commitTransaction();
      return null;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 上传文件
  async uploadSingle(userId: number, file: Express.Multer.File) {
    if (!file) {
      throw new RpcException({
        message: '请上传文件',
        code: HttpStatus.NOT_FOUND,
      });
    }
    try {
      const { result: foundFile, fileMd5 } = await this.checkRepeated(file);
      const fileType = this.checkFileType(file);
      let fileMeta: FileEntity;
      if (foundFile) {
        await this.fileOperationService.deleteFile(file.path);
        fileMeta = await this.createFile(userId, {
          ...foundFile,
          originalFileName:
            file.originalname || file.filename || foundFile.originalFileName,
        });
      } else {
        fileMeta = await this.createFile(userId, {
          ...file,
          fileMd5,
          fileType,
        });
      }
      return { fileId: fileMeta.id };
    } catch (error) {
      await fs.promises.unlink(file.path);
      throw error;
    }
  }

  // 分片上传：更新任务中已上传分片数和 chunk_status 状态
  async uploadChunk(taskId: number, chunkIndex: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let task: TaskEntity | null = null;
    try {
      task = await queryRunner.manager.findOne(TaskEntity, {
        where: { id: taskId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!task) {
        throw new RpcException({
          message: '未找到上传任务',
          code: HttpStatus.NOT_FOUND,
        });
      }
      if (task.status === 'completed') {
        return { taskId: task.id, chunkIndex, status: 'completed' };
      }
      task.chunkStatus = task.chunkStatus || {};
      if (task.chunkStatus[chunkIndex] === true) {
        throw new RpcException({
          message: '当前分片已上传',
          code: HttpStatus.CONFLICT,
        });
      }
      task.uploadedChunks = (task.uploadedChunks || 0) + 1;
      task.chunkStatus[chunkIndex] = true;
      await queryRunner.manager.save(TaskEntity, task);
      await queryRunner.commitTransaction();
      return { taskId: task.id, chunkIndex, status: 'uploaded' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (task) {
        task.chunkStatus = task.chunkStatus || {};
        task.chunkStatus[chunkIndex] = false;
        await queryRunner.manager.save(task);
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createUploadTask(userId: number, taskMeta: CreateTaskDto) {
    const { fileName, fileSize, fileType, fileMd5, totalChunks } = taskMeta;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const file = await queryRunner.manager.findOne(FileEntity, {
        where: { fileMd5 },
      });
      if (file) {
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

        const task = queryRunner.manager.create(TaskEntity, {
          fileName: fileName,
          fileSize: file.fileSize,
          fileType: file.fileType,
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

        return { file_id: file.id, status: 'completed' };
      }

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

      return { taskId: task.id, status: 'uploading' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async completeUpload(userId: number, taskId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let task: TaskEntity | null = null;
    try {
      task = await queryRunner.manager.findOne(TaskEntity, {
        where: { id: taskId },
      });
      if (!task) {
        throw new RpcException({
          message: '未找到上传任务',
          code: HttpStatus.NOT_FOUND,
        });
      }
      if (task.status === 'completed') {
        return { status: 'completed' };
      }
      if (task.status === 'failed') {
        throw new RpcException({
          message: '当前任务失败，请重新上传',
          code: HttpStatus.INTERNAL_SERVER_ERROR,
        });
      }
      if (task.uploadedChunks !== task.totalChunks) {
        return { status: 'processing' };
      }

      let folder = 'uploads/other';
      if (task.fileType.startsWith('image')) folder = 'uploads/images';
      else if (task.fileType.startsWith('video')) folder = 'uploads/videos';
      else if (task.fileType.startsWith('application'))
        folder = 'uploads/documents';
      else if (task.fileType.startsWith('audio')) folder = 'uploads/audio';

      await fs.promises.mkdir(folder, { recursive: true });

      const fileExtension = path.extname(task.fileName);
      const storageFileName = `${uuidv4()}${fileExtension}`;
      const finalPath = path.join(folder, storageFileName);

      const chunkPaths: string[] = [];
      for (let i = 1; i <= task.totalChunks; i++) {
        const chunkPath = path.join('uploads/chunks', `${task.fileMd5}-${i}`);
        chunkPaths.push(chunkPath);
      }

      await Promise.all(
        chunkPaths.map((chunkPath) =>
          this.fileOperationService.mergeFile(chunkPath, finalPath),
        ),
      );

      const chunkDeletionPromises = chunkPaths.map((chunkPath) =>
        fs.promises.unlink(chunkPath),
      );
      await Promise.all(chunkDeletionPromises);

      task.status = 'completed';
      task.fileSize = fs.statSync(finalPath).size;
      await queryRunner.manager.save(task);

      const newFile = this.fileRepository.create({
        originalFileName: task.fileName,
        storageFileName: storageFileName,
        filePath: finalPath,
        fileSize: task.fileSize,
        fileType: task.fileType,
        fileMd5: task.fileMd5,
        createdBy: userId,
        updatedBy: userId,
      });
      await queryRunner.manager.save(newFile);

      await queryRunner.commitTransaction();
      return { message: 'File uploaded and merged successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (task) {
        const chunkDeletionPromises: Promise<void>[] = [];
        for (let i = 1; i <= task.totalChunks; i++) {
          const chunkPath = path.join('uploads/chunks', `${task.fileMd5}-${i}`);
          chunkDeletionPromises.push(
            fs.promises
              .unlink(chunkPath)
              .catch((err) =>
                console.error(`Failed to delete chunk ${i}: ${err.message}`),
              ),
          );
        }
        await Promise.all(chunkDeletionPromises);
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getUploadTaskStatus(taskId: number) {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new RpcException({
        message: '未找到上传任务',
        code: HttpStatus.NOT_FOUND,
      });
    }
    return {
      taskId: task.id,
      status: task.status,
      chunkStatus: task.chunkStatus,
      totalChunks: task.totalChunks,
      uploadedChunks: task.uploadedChunks,
    };
  }
}
