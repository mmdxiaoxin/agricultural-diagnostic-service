import { formatResponse } from '@/common/helpers/response.helper';
import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as archiver from 'archiver';
import { Request, Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { CreateTempLinkDto } from '../dto/create-link.dto';
import { File as FileEntity } from '../models/file.entity';
import { FileService } from './file.service';

@Injectable()
export class FileDownloadService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileService: FileService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 单个文件下载
   * @param fileMeta 文件元数据
   * @param req 请求对象
   * @param res 响应对象
   */
  async downloadFile(fileMeta: FileEntity, req: Request, res: Response) {
    const filePath = join(process.cwd(), fileMeta.filePath);
    const range = req.headers.range;

    if (!range) {
      // 普通下载
      res
        .status(HttpStatus.OK)
        .set({
          'Content-Length': fileMeta.fileSize,
          'Content-Type': fileMeta.fileType,
        })
        .setHeader(
          'Content-Disposition',
          `attachment; filename="${encodeURIComponent(fileMeta.originalFileName)}"`,
        )
        .sendFile(filePath);
      return;
    }

    // 断点续传
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileMeta.fileSize - 1;

    if (start >= fileMeta.fileSize || end >= fileMeta.fileSize) {
      return res
        .status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
        .send('Requested range not satisfiable');
    }

    res
      .status(HttpStatus.PARTIAL_CONTENT)
      .set({
        'Content-Range': `bytes ${start}-${end}/${fileMeta.fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': fileMeta.fileType,
      })
      .setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(fileMeta.originalFileName)}"`,
      )
      .sendFile(filePath, {
        headers: { Range: `bytes=${start}-${end}` },
        start, // 设置文件读取的起始位置
        end, // 设置文件读取的结束位置
      });
  }

  /**
   * 批量文件下载并压缩为 zip 文件
   * @param filesMeta 文件元数据数组
   * @param res 响应对象
   */
  async downloadFilesAsZip(filesMeta: FileEntity[], res: Response) {
    const zipFileName = 'files.zip';
    const zip = archiver('zip', { zlib: { level: 9 } });

    res.attachment(zipFileName);
    zip.pipe(res);

    // 将每个文件添加到 zip
    for (const fileMeta of filesMeta) {
      const filePath = join(process.cwd(), fileMeta.filePath);
      zip.append(createReadStream(filePath), {
        name: fileMeta.originalFileName,
      });
    }

    // 完成压缩包创建
    zip.finalize();

    // 错误处理
    zip.on('error', (err) => {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send(`Error creating zip file: ${err.message}`);
    });
  }

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
    )}/api/file/access-link/${token}`;
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
