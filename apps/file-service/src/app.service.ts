import { File as FileEntity } from '@app/database/entities';
import { FileOperationService } from '@app/file-operation/file-operation.service';
import {
  UpdateFileDto,
  UpdateFilesAccessDto,
} from '@common/dto/file/update-file.dto';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { DataSource, In } from 'typeorm';

@Injectable()
export class FileService {
  constructor(
    private readonly fileOperationService: FileOperationService,
    private readonly dataSource: DataSource,
  ) {}

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
        throw new RpcException('未找到文件');
      }
      if (file.createdBy !== userId) {
        throw new RpcException('无权修改他人文件');
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
        throw new RpcException('未找到文件');
      }
      for (const file of files) {
        if (file.createdBy !== userId) {
          throw new RpcException('无权修改他人文件');
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
        throw new RpcException('未找到文件');
      }
      if (file.createdBy !== userId) {
        throw new RpcException('无权删除他人文件');
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
        throw new RpcException('未找到文件');
      }
      for (const file of files) {
        if (file.createdBy !== userId) {
          throw new RpcException('无权删除他人文件');
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
}
