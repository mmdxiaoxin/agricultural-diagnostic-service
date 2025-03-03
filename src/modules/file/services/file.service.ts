import { Injectable } from '@nestjs/common';
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
