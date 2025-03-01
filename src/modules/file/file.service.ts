import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { File as FileEntity } from './file.entity';
import { UserPayload } from '@/common/guards/auth.guard';
import { getFileType } from '@/common/utils';

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
    return this.fileRepository
      .createQueryBuilder('file')
      .select([
        'SUM(file.fileSize) AS used',
        'MAX(file.updatedAt) AS last_updated',
      ])
      .where('file.createdBy = :createdBy', { createdBy })
      .andWhere('file.fileType IN (:...fileTypes)', { fileTypes })
      .getRawOne();
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

    const [total, images, videos, apps, audios, docs, others] =
      await Promise.all([
        this.computeFileSizeByType(createdBy, []),
        this.computeFileSizeByType(createdBy, imageTypes),
        this.computeFileSizeByType(createdBy, videoTypes),
        this.computeFileSizeByType(createdBy, appTypes),
        this.computeFileSizeByType(createdBy, audioTypes),
        this.computeFileSizeByType(createdBy, docTypes),
        this.computeFileSizeByType(createdBy, otherTypes),
      ]);

    return {
      total,
      images,
      videos,
      apps,
      audios,
      docs,
      others,
    };
  }
}
