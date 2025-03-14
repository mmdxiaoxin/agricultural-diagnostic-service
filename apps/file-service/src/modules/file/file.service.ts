import { File as FileEntity } from '@app/database/entities';
import { FileOperationService } from '@app/file-operation/file-operation.service';
import {
  UpdateFileDto,
  UpdateFilesAccessDto,
} from '@common/dto/file/update-file.dto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { getFileType } from '@shared/utils';
import { DataSource, In, Repository } from 'typeorm';

@Injectable()
export class FileService {
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
  async getFiles(userId: number) {
    const files = await this.fileRepository.find({
      where: { createdBy: userId },
    });
    return {
      success: true,
      result: files,
    };
  }

  /**
   * 获取文件列表
   * @param fileIds
   * @returns
   */
  async getFilesById(fileIds: number[]) {
    const files = await this.fileRepository.find({
      where: { id: In(fileIds) },
    });
    return {
      success: true,
      result: files,
    };
  }

  /**
   * 获取文件列表分页
   * @param page
   * @param pageSize
   * @param filters
   * @param userId
   * @returns
   */
  async getFilesList(
    page: number,
    pageSize: number,
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
    const [list, total] = await queryBuilder
      .orderBy('file.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      success: true,
      result: {
        list,
        total,
        page,
        pageSize,
      },
    };
  }

  /**
   * 获取文件信息
   * @param fileId
   * @returns
   */
  async getFile(fileId: number) {
    const file = await this.fileRepository.findOne({
      where: { id: fileId },
    });
    return {
      success: true,
      result: file,
    };
  }

  /**
   * 获取文件信息
   * @param fileId
   * @returns
   */
  async getFileById(fileId: number) {
    const file = await this.fileRepository.findOne({
      where: { id: fileId },
    });
    return { success: true, result: file };
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
      const file = await queryRunner.manager.findOne(FileEntity, {
        where: { id: fileId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!file) {
        throw new RpcException({
          code: HttpStatus.NOT_FOUND,
          message: '未找到文件',
        });
      }
      if (file.createdBy !== userId) {
        throw new RpcException({
          code: HttpStatus.FORBIDDEN,
          message: '无权修改他人文件',
        });
      }
      Object.assign(file, fileMeta);
      file.updatedBy = userId;
      file.version += 1;
      await queryRunner.manager.save(file);
      await queryRunner.commitTransaction();
      return { success: true };
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
        throw new RpcException({
          code: HttpStatus.NOT_FOUND,
          message: '未找到文件',
        });
      }
      for (const file of files) {
        if (file.createdBy !== userId) {
          throw new RpcException({
            code: HttpStatus.FORBIDDEN,
            message: '无权修改他人文件',
          });
        }
        file.access = access;
        file.updatedBy = userId;
        file.version += 1;
      }
      await queryRunner.manager.save(files);
      await queryRunner.commitTransaction();
      return { success: true };
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
        lock: { mode: 'pessimistic_write' },
      });
      if (!file) {
        throw new RpcException({
          code: HttpStatus.NOT_FOUND,
          message: '未找到文件',
        });
      }
      if (file.createdBy !== userId) {
        throw new RpcException({
          code: HttpStatus.FORBIDDEN,
          message: '无权删除他人文件',
        });
      }
      // 检查文件是否被引用
      const referenceCount = await queryRunner.manager.count(FileEntity, {
        where: { fileMd5: file.fileMd5 },
      });
      // 如果文件没有被引用，删除文件元数据及文件
      if (referenceCount === 0) {
        await queryRunner.manager.delete(FileEntity, fileId);
        await queryRunner.commitTransaction();
        await this.fileOperationService.deleteFile(file.filePath);
      } else {
        // 如果文件被引用，直接删除文件元数据，不删除实际文件
        await queryRunner.manager.delete(FileEntity, fileId);
        await queryRunner.commitTransaction();
      }
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
  async deleteFiles(fileIds: number[], userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const files = await queryRunner.manager.find(FileEntity, {
        where: { id: In(fileIds) },
      });
      if (files.length === 0) {
        throw new RpcException({
          code: HttpStatus.NOT_FOUND,
          message: '未找到文件',
        });
      }
      for (const file of files) {
        if (file.createdBy !== userId) {
          throw new RpcException({
            code: HttpStatus.FORBIDDEN,
            message: '无权删除他人文件',
          });
        }
      }
      // 检查是否有引用该文件
      const fileMd5s = files.map((file) => file.fileMd5);
      const referenceCount = await queryRunner.manager.count(FileEntity, {
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

  /**
   * 获取文件使用量统计
   * @param userId
   * @returns
   */
  async getFilesStatisticUsage(userId: number) {
    const computeFileSizeByType = async (
      createdBy: number,
      fileTypes: string[],
    ) => {
      const queryBuilder = this.fileRepository
        .createQueryBuilder('file')
        .select([
          'SUM(file.fileSize) AS used',
          'MAX(file.updatedAt) AS last_updated',
        ])
        .where('file.createdBy = :createdBy', { createdBy });

      if (fileTypes.length > 0) {
        queryBuilder.andWhere('file.fileType IN (:...fileTypes)', {
          fileTypes,
        });
      }
      return queryBuilder.getRawOne();
    };

    const imageTypes = getFileType('image');
    const videoTypes = getFileType('video');
    const appTypes = getFileType('app');
    const audioTypes = getFileType('audio');
    const docTypes = getFileType('application');
    const otherTypes = getFileType('other');

    try {
      const [total, image, video, app, audio, docs, other] = await Promise.all([
        computeFileSizeByType(userId, []),
        computeFileSizeByType(userId, imageTypes),
        computeFileSizeByType(userId, videoTypes),
        computeFileSizeByType(userId, appTypes),
        computeFileSizeByType(userId, audioTypes),
        computeFileSizeByType(userId, docTypes),
        computeFileSizeByType(userId, otherTypes),
      ]);

      return {
        success: true,
        result: {
          total: total || { used: 0, last_updated: null },
          image: image || { used: 0, last_updated: null },
          video: video || { used: 0, last_updated: null },
          app: app || { used: 0, last_updated: null },
          audio: audio || { used: 0, last_updated: null },
          docs: docs || { used: 0, last_updated: null },
          other: other || { used: 0, last_updated: null },
        },
      };
    } catch (error) {
      throw new RpcException('获取文件空间信息失败: ' + error);
    }
  }
}
