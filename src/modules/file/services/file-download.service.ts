import { formatResponse } from '@/common/helpers/response.helper';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { CreateTempLinkDto } from '../dto/create-link.dto';
import { File as FileEntity } from '../models/file.entity';
import { FileService } from './file.service';

@Injectable()
export class FileDownloadService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly fileService: FileService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 生成临时访问链接
   * @param fileId
   * @param request
   * @param dto
   * @returns
   */
  async generateAccessLink(
    fileId: number,
    request: Request,
    dto: CreateTempLinkDto,
  ) {
    const file = await this.fileService.findById(fileId);
    if (file.createdBy !== request.user.userId) {
      throw new BadRequestException('无权操作他人文件');
    }
    const payload = {
      fileId: file.id,
    };
    const token = this.jwtService.sign(payload, {
      expiresIn: dto.expiresIn || '1h',
    });
    const tempLink = `${request.protocol}://${request.get(
      'host',
    )}/file/access-link/${token}`;
    return formatResponse(200, { link: tempLink }, '临时链接生成成功');
  }

  /**
   * 验证访问链接
   * @param token
   * @returns
   */
  verifyAccessLink(token: string) {
    try {
      const payload: { fileId: number } = this.jwtService.verify(token);
      return payload.fileId;
    } catch (error) {
      throw new BadRequestException('链接验证失败');
    }
  }
}
