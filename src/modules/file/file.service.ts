import { formatResponse } from '@/common/helpers/response.helper';
import { getFileType, getModelMimeType } from '@/common/utils';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource, In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { File as FileEntity } from './models/file.entity';
import { Task as TaskEntity } from './models/task.entity';
import { FileOperationService } from './operation.service';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
    private readonly fileOperationService: FileOperationService,
    private readonly dataSource: DataSource,
  ) {}

  private async computeFileSizeByType(createdBy: number, fileTypes: string[]) {
    const queryBuilder = this.fileRepository
      .createQueryBuilder('file')
      .select([
        'SUM(file.fileSize) AS used',
        'MAX(file.updatedAt) AS last_updated',
      ])
      .where('file.createdBy = :createdBy', { createdBy });

    if (fileTypes.length > 0) {
      queryBuilder.andWhere('file.fileType IN (:...fileTypes)', { fileTypes });
    }

    return queryBuilder.getRawOne();
  }

  async diskUsageGet(userId: number) {
    if (!userId) {
      throw new InternalServerErrorException('用户信息错误');
    }

    const imageTypes = getFileType('image');
    const videoTypes = getFileType('video');
    const appTypes = getFileType('app');
    const audioTypes = getFileType('audio');
    const docTypes = getFileType('application');
    const otherTypes = getFileType('other');

    try {
      const [total, image, video, app, audio, docs, other] = await Promise.all([
        this.computeFileSizeByType(userId, []),
        this.computeFileSizeByType(userId, imageTypes),
        this.computeFileSizeByType(userId, videoTypes),
        this.computeFileSizeByType(userId, appTypes),
        this.computeFileSizeByType(userId, audioTypes),
        this.computeFileSizeByType(userId, docTypes),
        this.computeFileSizeByType(userId, otherTypes),
      ]);

      return formatResponse(
        200,
        {
          total: total || { used: 0, last_updated: null },
          image: image || { used: 0, last_updated: null },
          video: video || { used: 0, last_updated: null },
          app: app || { used: 0, last_updated: null },
          audio: audio || { used: 0, last_updated: null },
          docs: docs || { used: 0, last_updated: null },
          other: other || { used: 0, last_updated: null },
        },
        '空间信息获取成功',
      );
    } catch (error) {
      throw new InternalServerErrorException('获取文件空间信息失败: ' + error);
    }
  }

  async fileListGet(
    page: number = 1,
    pageSize: number = 10,
    filters: {
      fileType?: string;
      originalFileName?: string;
      createdStart?: string;
      createdEnd?: string;
      updatedStart?: string;
      updatedEnd?: string;
    },
    userId: number, // 添加用户ID
  ) {
    const queryBuilder = this.fileRepository.createQueryBuilder('file');

    // 过滤当前用户的文件
    queryBuilder.andWhere('file.createdBy = :userId', { userId });

    // 过滤文件类型
    if (filters.fileType) {
      queryBuilder.andWhere('file.fileType = :fileType', {
        fileType: filters.fileType,
      });
    }

    // 模糊匹配文件名
    if (filters.originalFileName) {
      queryBuilder.andWhere('file.originalFileName LIKE :originalFileName', {
        originalFileName: `%${filters.originalFileName}%`,
      });
    }

    // 创建时间范围
    if (filters.createdStart && filters.createdEnd) {
      queryBuilder.andWhere(
        'file.createdAt BETWEEN :createdStart AND :createdEnd',
        {
          createdStart: new Date(filters.createdStart),
          createdEnd: new Date(filters.createdEnd),
        },
      );
    }

    // 更新时间范围
    if (filters.updatedStart && filters.updatedEnd) {
      queryBuilder.andWhere(
        'file.updatedAt BETWEEN :updatedStart AND :updatedEnd',
        {
          updatedStart: new Date(filters.updatedStart),
          updatedEnd: new Date(filters.updatedEnd),
        },
      );
    }

    // 获取文件列表及总数
    const [files, total] = await queryBuilder
      .orderBy('file.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return formatResponse(
      200,
      {
        list: files,
        total,
        page,
        pageSize,
      },
      '文件列表获取成功',
    );
  }

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

  async updateFile(dto: UpdateFileDto) {
    const { fileId, ...fileMeta } = dto;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const file = await this.fileRepository.findOne({
        where: { id: fileId },
      });
      if (!file) {
        throw new NotFoundException('未找到文件');
      }
      Object.assign(file, fileMeta);
      await queryRunner.manager.save(file);
      await queryRunner.commitTransaction();
      return formatResponse(200, null, '文件信息修改成功');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 上传文件
  async uploadSingle(user_id: number, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }
    try {
      const { result: foundFile, fileMd5 } = await this.checkRepeated(file);
      const fileType = this.checkFileType(file);
      let fileMeta: FileEntity;
      if (foundFile) {
        await this.fileOperationService.deleteFile(file.path);
        fileMeta = await this.createFile(user_id, foundFile);
      } else {
        fileMeta = await this.createFile(user_id, {
          ...file,
          fileMd5,
          fileType,
        });
      }
      return formatResponse(
        200,
        {
          fileId: fileMeta.id,
        },
        '文件上传成功',
      );
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
      });
      if (!task) {
        throw new NotFoundException('Task not found');
      }
      if (task.status === 'completed') {
        throw new BadRequestException('Task already completed');
      }
      // 更新已上传分片数
      task.uploadedChunks = (task.uploadedChunks || 0) + 1;
      // 更新分片状态，假设 chunkStatus 为 JSON 对象存储各分片上传结果
      task.chunkStatus = task.chunkStatus || {};
      task.chunkStatus[chunkIndex] = true;
      await queryRunner.manager.save(TaskEntity, task);
      await queryRunner.commitTransaction();
      return formatResponse(
        200,
        {
          taskId: task.id,
          chunkIndex,
        },
        `Chunk ${chunkIndex} uploaded successfully`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (task) {
        task.chunkStatus = task.chunkStatus || {};
        task.chunkStatus[chunkIndex] = false;
        await this.taskRepository.save(task);
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

        return formatResponse(
          200,
          { file_id: file.id, status: 'completed' },
          '上传完毕',
        );
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

      return formatResponse(
        201,
        { taskId: task.id, status: 'uploading' },
        '任务创建成功',
      );
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
    try {
      const task = await this.taskRepository.findOne({
        where: { id: taskId },
      });
      if (!task) {
        throw new NotFoundException('未找到上传任务');
      }
      if (task.status === 'completed') {
        await queryRunner.rollbackTransaction();
        return formatResponse(200, null, '当前任务已完成');
      }
      // 失败状态响应
      if (task.status === 'failed') {
        throw new InternalServerErrorException('当前任务失败，请重新上传');
      }
      // 任务未完成状态响应
      if (task.uploadedChunks !== task.totalChunks) {
        await queryRunner.rollbackTransaction();
        return formatResponse(202, null, '当前任务还未完成');
      }
      // 分配目录
      let folder = 'uploads/other'; // 默认存储在 "other" 文件夹
      if (task.fileType.startsWith('image')) {
        folder = 'uploads/images'; // 存储图片文件
      } else if (task.fileType.startsWith('video')) {
        folder = 'uploads/videos'; // 存储视频文件
      } else if (task.fileType.startsWith('application')) {
        folder = 'uploads/documents'; // 存储文档文件
      } else if (task.fileType.startsWith('audio')) {
        folder = 'uploads/audio'; // 存储音频文件
      }
      // 确保文件夹存在，如果没有则创建
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
      }

      const fileExtension = path.extname(task.fileName);
      const storageFileName = `${uuidv4()}${fileExtension}`;
      const finalPath = path.join(folder, storageFileName);
      const writeStream = fs.createWriteStream(finalPath);

      // 文件合并过程
      for (let i = 1; i <= task.totalChunks; i++) {
        const chunk = fs.createReadStream(
          path.join('uploads/chunks', `${task.fileMd5}-${i}`),
        );
        chunk.pipe(writeStream, { end: false });
        await new Promise((resolve, reject) => {
          chunk.on('end', () => resolve(null));
          chunk.on('error', reject);
        });
      }
      // 响应给用户
      writeStream.on('finish', async () => {
        try {
          // 删除临时分片文件
          for (let i = 1; i <= task.totalChunks; i++) {
            await fs.promises.unlink(
              path.join('uploads/chunks', `${task.fileMd5}-${i}`),
            );
          }
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

          return formatResponse(
            201,
            null,
            'File uploaded and merged successfully',
          );
        } catch (error) {
          throw error;
        }
      });
      writeStream.end();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getUploadTaskStatus(taskId: number) {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
    });
    if (!task) {
      throw new NotFoundException('未找到上传任务');
    }
    return formatResponse(200, {
      taskId: task.id,
      status: task.status,
      chunkStatus: task.chunkStatus,
      totalChunks: task.totalChunks,
      uploadedChunks: task.uploadedChunks,
    });
  }

  async findById(fileId: number) {
    return this.fileRepository.findOne({
      where: { id: fileId },
    });
  }

  async findByIds(fileIds: number[]) {
    return this.fileRepository.find({
      where: { id: In(fileIds) },
    });
  }
}
