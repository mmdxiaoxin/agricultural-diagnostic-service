import { formatResponse } from '@/common/helpers/response.helper';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { UpdateFileDto, UpdateFilesAccessDto } from '../dto/update-file.dto';
import { File as FileEntity } from '../models/file.entity';
import { Task as TaskEntity } from '../models/task.entity';
import { FileOperationService } from './file-operation.service';

@Injectable()
export class FileManageService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly fileOperationService: FileOperationService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 获取文件列表
   * @param page
   * @param pageSize
   * @param filters
   * @param userId
   * @returns
   */
  async fileListGet(
    page: number = 1,
    pageSize: number = 10,
    filters: {
      fileType?: string[];
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
      queryBuilder.andWhere('file.fileType IN (:...fileType)', {
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

  /**
   * 创建文件
   * @param userId 用户ID
   * @param fileData 文件上传信息
   * @returns 创建的文件实体
   */
  async createFile(userId: number, fileData: Partial<FileEntity>) {
    try {
      // 校验字段，根据不同实体类型处理
      const fileMeta = this.fileRepository.create({
        ...fileData,
        createdBy: userId,
        updatedBy: userId,
      });
      return await this.fileRepository.save(fileMeta);
    } catch (error) {
      throw new BadRequestException(
        '创建实体失败：' + (error?.message || error),
      );
    }
  }

  /**
   * 更新文件信息
   * @param userId
   * @param dto
   * @returns
   */
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
        throw new NotFoundException('未找到文件');
      }
      if (file.createdBy !== userId) {
        throw new BadRequestException('无权修改他人文件');
      }
      Object.assign(file, fileMeta);
      file.updatedBy = userId;
      file.version += 1;
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

  /**
   * 批量更新文件权限
   * @param userId
   * @param dto
   * @returns
   */
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
        throw new NotFoundException('未找到文件');
      }
      for (const file of files) {
        if (file.createdBy !== userId) {
          throw new BadRequestException('无权修改他人文件');
        }
        file.access = access;
        file.updatedBy = userId;
        file.version += 1;
      }
      await queryRunner.manager.save(files);
      await queryRunner.commitTransaction();
      return formatResponse(200, null, '文件权限修改成功');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 删除文件
   * @param fileId
   * @param userId
   * @returns
   */
  async deleteFile(fileId: number, userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const file = await queryRunner.manager.findOne(FileEntity, {
        where: { id: fileId },
      });
      if (!file) {
        throw new NotFoundException('未找到文件');
      }
      if (file.createdBy !== userId) {
        throw new BadRequestException('无权删除他人文件');
      }
      // 检查是否有引用该文件
      const referenceCount = await queryRunner.manager.count(TaskEntity, {
        where: { fileMd5: file.fileMd5 },
      });
      if (referenceCount === 0) {
        // 如果没有被引用，删除文件
        await this.fileOperationService.deleteFile(file.filePath);
      }
      // 删除文件元数据
      await queryRunner.manager.delete(FileEntity, fileId);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 批量删除文件
   * @param fileIds
   * @returns
   */
  async deleteFiles(fileIds: number[]) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const files = await queryRunner.manager.find(FileEntity, {
        where: { id: In(fileIds) },
      });
      if (files.length === 0) {
        throw new NotFoundException('未找到文件');
      }
      // 检查是否有引用该文件
      const fileMd5s = files.map((file) => file.fileMd5);
      const referenceCount = await queryRunner.manager.count(TaskEntity, {
        where: { fileMd5: In(fileMd5s) },
      });
      const filesToDelete = files.filter((file) => {
        const count = referenceCount[file.fileMd5];
        return count === 0;
      });
      // 删除文件
      const deletionPromises = filesToDelete.map((file) =>
        this.fileOperationService.deleteFile(file.filePath),
      );
      await Promise.all(deletionPromises);
      // 删除文件元数据
      await queryRunner.manager.delete(FileEntity, fileIds);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
