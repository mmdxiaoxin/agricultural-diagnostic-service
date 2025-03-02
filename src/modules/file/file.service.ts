import { UserPayload } from '@/common/guards/auth.guard';
import { getFileType } from '@/common/utils';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { File as FileEntity } from './file.entity';
import { formatResponse } from '@/common/helpers/response.helper';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
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

  async uploadSingle(file: Express.Multer.File) {}

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
