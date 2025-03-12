import { formatResponse } from '@shared/helpers/response.helper';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import {
  UpdateFileDto,
  UpdateFilesAccessDto,
} from '../../../../../../packages/common/src/dto/file/update-file.dto';
import { Task as TaskEntity, File as FileEntity } from '@app/database/entities';
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
   * 创建文件并开启事务
   * @param userId
   * @param fileData
   * @param queryRunner
   * @returns
   */
  async createFileInTransaction(
    userId: number,
    fileData: Partial<FileEntity>,
    queryRunner: QueryRunner,
  ) {
    try {
      // 校验字段，根据不同实体类型处理
      const fileMeta = this.fileRepository.create({
        ...fileData,
        createdBy: userId,
        updatedBy: userId,
      });
      return await queryRunner.manager.save(fileMeta);
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
      const file = await queryRunner.manager.findOne(FileEntity, {
        where: { id: fileId },
        lock: { mode: 'pessimistic_write' },
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
   * 更新文件信息并开启事务
   * @param userId
   * @param dto
   * @param queryRunner
   * @returns 文件实体
   */
  async updateFileInTransaction(
    userId: number,
    dto: UpdateFileDto,
    queryRunner: QueryRunner,
  ) {
    const { fileId, ...fileMeta } = dto;
    try {
      const file = await queryRunner.manager.findOne(FileEntity, {
        where: { id: fileId },
        lock: { mode: 'pessimistic_write' },
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
      return await queryRunner.manager.save(file);
    } catch (error) {
      throw error;
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
        lock: { mode: 'pessimistic_write' },
      });
      if (!file) {
        throw new NotFoundException('未找到文件');
      }
      if (file.createdBy !== userId) {
        throw new BadRequestException('无权删除他人文件');
      }
      // 检查文件是否被引用
      const referenceCount = await queryRunner.manager.count(TaskEntity, {
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
