import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { File as FileEntity } from '../models/file.entity';
import { formatResponse } from '@/shared/helpers/response.helper';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
  ) {}

  async findById(fileId: number) {
    const file = await this.fileRepository.findOne({
      where: { id: fileId },
    });
    if (!file) {
      throw new NotFoundException('没有找到文件.');
    }
    return file;
  }

  async findByMd5(fileMd5: string) {
    const file = await this.fileRepository.findOne({
      where: { fileMd5 },
    });
    if (!file) {
      throw new NotFoundException('没有找到文件.');
    }
    return file;
  }

  async findByIds(fileIds: number[]) {
    const files = await this.fileRepository.find({
      where: { id: In(fileIds) },
    });
    if (!files.length) {
      throw new NotFoundException('没有找到文件.');
    }
    return files;
  }

  /**
   * 获取文件列表
   * @param page
   * @param pageSize
   * @param filters
   * @param userId
   * @returns
   */
  async filesGet(userId: number) {
    const files = await this.fileRepository.find({
      where: { createdBy: userId },
    });
    return formatResponse(200, files, '文件获取成功');
  }

  /**
   * 获取文件列表分页
   * @param page
   * @param pageSize
   * @param filters
   * @param userId
   * @returns
   */
  async filesListGet(
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
    const [list, total] = await queryBuilder
      .orderBy('file.id', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return formatResponse(
      200,
      {
        list,
        total,
        page,
        pageSize,
      },
      '文件列表获取成功',
    );
  }
}
