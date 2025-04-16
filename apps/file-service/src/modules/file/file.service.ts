import { FileEntity } from '@app/database/entities';
import { FileOperationService } from '@app/file-operation/file-operation.service';
import {
  UpdateFileDto,
  UpdateFilesAccessDto,
} from '@common/dto/file/update-file.dto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { formatResponse } from '@shared/helpers/response.helper';
import { getFileType } from '@shared/utils';
import { DataSource, In, Not, Repository } from 'typeorm';

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
  async findAll(userId: number) {
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
  async findByIds(fileIds: number[]) {
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
  async findList(
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

    return formatResponse(
      200,
      { list, total, page, pageSize },
      '文件列表获取成功',
    );
  }

  /**
   * 获取文件信息
   * @param fileId
   * @returns
   */
  async findById(fileId: number) {
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
  async update(userId: number, dto: UpdateFileDto) {
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
  async updateAccessBatch(userId: number, dto: UpdateFilesAccessDto) {
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
  async delete(fileId: number, userId: number) {
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

      // 获取该文件的所有引用（排除当前文件）
      const references = await queryRunner.manager.find(FileEntity, {
        where: {
          fileMd5: file.fileMd5,
          id: Not(fileId), // 排除当前文件
        },
      });

      // 如果没有其他引用，则删除实际文件
      if (references.length === 0) {
        await this.fileOperationService.deleteFile(file.filePath);
      }

      // 删除文件元数据
      await queryRunner.manager.delete(FileEntity, fileId);
      await queryRunner.commitTransaction();
      return formatResponse(204, null, '成功删除文件');
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
  async deleteBatch(fileIds: number[], userId: number) {
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

      // 检查权限
      for (const file of files) {
        if (file.createdBy !== userId) {
          throw new RpcException({
            code: HttpStatus.FORBIDDEN,
            message: '无权删除他人文件',
          });
        }
      }

      // 检查每个文件的引用（排除当前文件）
      const filesToDelete: FileEntity[] = [];
      for (const file of files) {
        const referenceCount = await queryRunner.manager.count(FileEntity, {
          where: {
            fileMd5: file.fileMd5,
            id: Not(file.id), // 排除当前文件
          },
        });

        if (referenceCount === 0) {
          filesToDelete.push(file);
        }
      }

      // 删除实际文件
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
  async findDisk(userId: number) {
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
    const archiveTypes = getFileType('archive');
    const audioTypes = getFileType('audio');
    const docTypes = getFileType('application');
    const otherTypes = getFileType('other');

    try {
      const [total, image, video, archive, audio, docs, other] =
        await Promise.all([
          computeFileSizeByType(userId, []),
          computeFileSizeByType(userId, imageTypes),
          computeFileSizeByType(userId, videoTypes),
          computeFileSizeByType(userId, archiveTypes),
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
          archive: archive || { used: 0, last_updated: null },
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
