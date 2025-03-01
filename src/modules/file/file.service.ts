import { UserPayload } from '@/common/guards/auth.guard';
import { getFileType } from '@/common/utils';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { File as FileEntity } from './file.entity';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
  ) {}

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

  async computeFileSizeByType(createdBy: number, fileTypes: string[]) {
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

  async computeDiskUsage(user: UserPayload) {
    const createdBy = user.userId;
    if (!createdBy) {
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
        this.computeFileSizeByType(createdBy, []),
        this.computeFileSizeByType(createdBy, imageTypes),
        this.computeFileSizeByType(createdBy, videoTypes),
        this.computeFileSizeByType(createdBy, appTypes),
        this.computeFileSizeByType(createdBy, audioTypes),
        this.computeFileSizeByType(createdBy, docTypes),
        this.computeFileSizeByType(createdBy, otherTypes),
      ]);

      return {
        total: total || { used: 0, last_updated: null },
        image: image || { used: 0, last_updated: null },
        video: video || { used: 0, last_updated: null },
        app: app || { used: 0, last_updated: null },
        audio: audio || { used: 0, last_updated: null },
        docs: docs || { used: 0, last_updated: null },
        other: other || { used: 0, last_updated: null },
      };
    } catch (error) {
      throw new InternalServerErrorException('获取文件空间信息失败: ' + error);
    }
  }
}
