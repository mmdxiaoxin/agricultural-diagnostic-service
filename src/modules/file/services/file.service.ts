import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { File as FileEntity } from '../models/file.entity';

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

  async findByIds(fileIds: number[]) {
    const files = await this.fileRepository.find({
      where: { id: In(fileIds) },
    });
    if (!files.length) {
      throw new NotFoundException('没有找到文件.');
    }
    return files;
  }
}
