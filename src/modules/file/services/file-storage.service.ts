import { formatResponse } from '@/common/helpers/response.helper';
import { getFileType } from '@/common/utils';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File as FileEntity } from '../models/file.entity';

@Injectable()
export class FileStorageService {
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
}
