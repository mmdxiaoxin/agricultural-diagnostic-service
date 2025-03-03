import { Roles } from '@/common/decorator/roles.decorator';
import { Role } from '@/common/enum/role.enum';
import { TypeormFilter } from '@/common/filters/typeorm.filter';
import { AuthGuard } from '@/common/guards/auth.guard';
import { FileGuard } from '@/common/guards/file.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as archiver from 'archiver';
import { Request, Response } from 'express';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { unlink } from 'fs/promises';
import { diskStorage } from 'multer';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CompleteChunkDto } from './dto/complete-chunk.dto';
import { CreateTempLinkDto } from './dto/create-link.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { DownloadFilesDto } from './dto/download-file.dto';
import { UpdateFileDto, UpdateFilesAccessDto } from './dto/update-file.dto';
import { UploadChunkDto } from './dto/upload-chunk.dto';
import { FileService } from './file.service';
import { FileSizeValidationPipe } from './pipe/file.pipe';

@Controller('file')
@UseFilters(TypeormFilter)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  // 获取空间使用信息
  @Get('disk-usage')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  async diskUsageGet(@Req() req: Request) {
    return this.fileService.diskUsageGet(req.user.userId);
  }

  // 获取文件列表
  @Get('list')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  async fileListGet(
    @Req() req: Request,
    @Query('page', ParseIntPipe) page?: number,
    @Query('pageSize', ParseIntPipe) pageSize?: number,
    @Query('fileType') fileType?: string,
    @Query('originalFileName') originalFileName?: string,
    @Query('createdStart') createdStart?: string,
    @Query('createdEnd') createdEnd?: string,
    @Query('updatedStart') updatedStart?: string,
    @Query('updatedEnd') updatedEnd?: string,
  ) {
    return this.fileService.fileListGet(
      page,
      pageSize,
      {
        fileType,
        originalFileName,
        createdStart,
        createdEnd,
        updatedEnd,
        updatedStart,
      },
      req.user.userId,
    );
  }

  // 单文件上传
  @Post('upload/single')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          let folder = 'uploads/other'; // 默认存储在 "other" 文件夹
          const mimeType = file.mimetype;

          // 按 MIME 类型分文件夹存储
          if (mimeType.startsWith('image')) {
            folder = 'uploads/images';
          } else if (mimeType.startsWith('video')) {
            folder = 'uploads/videos';
          } else if (mimeType.startsWith('application')) {
            folder = 'uploads/documents';
          } else if (mimeType.startsWith('audio')) {
            folder = 'uploads/audio';
          }

          if (!existsSync(folder)) {
            mkdirSync(folder, { recursive: true });
          }
          cb(null, folder);
        },
        filename: (req, file, cb) => {
          const uniqueName = Date.now() + '-' + uuidv4();
          // 修复中文乱码问题
          file.originalname = Buffer.from(file.originalname, 'latin1').toString(
            'utf-8',
          );
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async uploadSingle(
    @Req() req: Request,
    @UploadedFile(new FileSizeValidationPipe()) file: Express.Multer.File,
  ) {
    try {
      return this.fileService.uploadSingle(req.user.userId, file);
    } catch (error) {
      // 清理上传失败的文件
      const filePath = join('uploads', file.filename);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
      throw error;
    }
  }

  // 创建上传任务
  @Post('upload/create')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async createUploadTask(@Req() req: Request, @Body() dto: CreateTaskDto) {
    return this.fileService.createUploadTask(req.user.userId, dto);
  }

  // 查询上传任务状态
  @Get('upload/status/:taskId')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  async getUploadTaskStatus(
    @Param(
      'taskId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    taskId: number,
  ) {
    return this.fileService.getUploadTaskStatus(taskId);
  }

  // 合并分片
  @Post('upload/complete')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  async completeUpload(@Req() req: Request, @Body() dto: CompleteChunkDto) {
    return this.fileService.completeUpload(req.user.userId, dto.taskId);
  }

  // 文件分片上传
  @Post('upload/chunk')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  @UseInterceptors(
    FileInterceptor('chunk', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const folder = 'uploads/chunks';
          if (!existsSync(folder)) {
            mkdirSync(folder, { recursive: true });
          }
          cb(null, folder);
        },
        filename: (req, file, cb) => {
          const { fileMd5, chunkIndex } = req.body;

          if (!fileMd5 || !chunkIndex) {
            return cb(
              new Error('Missing fileMd5 or chunkIndex'),
              file.filename,
            );
          }
          cb(null, `${fileMd5}-${chunkIndex}`);
        },
      }),
    }),
  )
  async uploadChunk(
    @UploadedFile(new FileSizeValidationPipe()) file: Express.Multer.File,
    @Body() dto: UploadChunkDto,
  ) {
    try {
      return this.fileService.uploadChunk(dto.taskId, dto.chunkIndex);
    } catch (error) {
      // 清理上传失败的文件
      const chunkPath = join(
        'uploads/chunks',
        `${dto.fileMd5}-${dto.chunkIndex}`,
      );
      if (existsSync(chunkPath)) {
        await unlink(chunkPath);
      }
      throw error;
    }
  }

  // 文件下载
  @Get('download/:fileId')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard, FileGuard)
  async downloadFile(
    @Param(
      'fileId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    _: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const fileMeta = req.fileMeta; // 从请求中获取文件信息
    const filePath = join(process.cwd(), fileMeta.filePath); // 确保文件路径是绝对路径

    // 获取 Range 请求头
    const range = req.headers.range;

    // 如果没有 Range 头，正常返回文件
    if (!range) {
      res
        .status(HttpStatus.OK)
        .set({
          'Content-Length': fileMeta.fileSize,
          'Content-Type': fileMeta.fileType,
          'Content-Disposition': `attachment; filename="${fileMeta.originalFileName}"`,
        })
        .sendFile(filePath);
      return;
    }

    // 如果有 Range 头，进行断点续传
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileMeta.fileSize - 1;

    // 检查 Range 是否有效
    if (start >= fileMeta.fileSize || end >= fileMeta.fileSize) {
      return res
        .status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
        .send('Requested range not satisfiable');
    }

    // 设置响应头
    res
      .status(HttpStatus.PARTIAL_CONTENT)
      .set({
        'Content-Range': `bytes ${start}-${end}/${fileMeta.fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileMeta.originalFileName}"`,
      })
      .sendFile(filePath, {
        headers: {
          Range: `bytes=${start}-${end}`,
        },
        start, // 设置从文件流的哪个位置开始读取
        end, // 设置读取的结束位置
      });
  }

  // 批量文件下载
  @Post('download')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard, FileGuard)
  async downloadFiles(
    @Body() _: DownloadFilesDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const filesMeta = req.filesMeta;

    // 创建一个可写流，准备将压缩包发送给客户端
    const zipFileName = 'files.zip';
    const zip = archiver('zip', {
      zlib: { level: 9 },
    });

    res.attachment(zipFileName); // 设置响应头，指示浏览器下载文件
    zip.pipe(res); // 将zip流管道到响应流

    // 将文件添加到压缩包中
    for (const fileMeta of filesMeta) {
      const filePath = join(process.cwd(), fileMeta.filePath);

      // 添加文件到压缩包
      zip.append(createReadStream(filePath), {
        name: fileMeta.originalFileName,
      });
    }

    // 完成压缩包的创建
    zip.finalize();

    // 错误处理
    zip.on('error', (err) => {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send(`Error creating zip file: ${err.message}`);
    });
  }

  // 文件修改
  @Put('update')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  async updateFile(@Req() req: Request, @Body() dto: UpdateFileDto) {
    return this.fileService.updateFile(req.user.userId, dto);
  }

  // 批量文件权限修改
  @Put('access')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  async updateFilesAccess(
    @Req() req: Request,
    @Body() dto: UpdateFilesAccessDto,
  ) {
    return this.fileService.updateFilesAccess(req.user.userId, dto);
  }

  // 文件删除
  @Delete('delete/:fileId')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFile(
    @Param(
      'fileId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    fileId: number,
  ) {
    return this.fileService.deleteFile(fileId);
  }

  // 生成临时访问链接
  @Post('generate-link/:fileId')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  async generateAccessLink(
    @Param(
      'fileId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    fileId: number,
    @Req() req: Request,
    @Body() dto: CreateTempLinkDto,
  ) {
    return this.fileService.generateAccessLink(fileId, req, dto);
  }

  // 获取临时访问链接
  @Get('access-link/:token')
  async getAccessLink(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const fileId = this.fileService.verifyAccessLink(token);
    const fileMeta = await this.fileService.findById(fileId);
    if (!fileMeta) {
      return res.status(HttpStatus.NOT_FOUND).send('File not found');
    }
    const filePath = join(process.cwd(), fileMeta.filePath); // 确保文件路径是绝对路径

    // 获取 Range 请求头
    const range = req.headers.range;

    // 如果没有 Range 头，正常返回文件
    if (!range) {
      res
        .status(HttpStatus.OK)
        .set({
          'Content-Length': fileMeta.fileSize,
          'Content-Type': fileMeta.fileType,
          'Content-Disposition': `attachment; filename="${fileMeta.originalFileName}"`,
        })
        .sendFile(filePath);
      return;
    }

    // 如果有 Range 头，进行断点续传
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileMeta.fileSize - 1;

    // 检查 Range 是否有效
    if (start >= fileMeta.fileSize || end >= fileMeta.fileSize) {
      return res
        .status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
        .send('Requested range not satisfiable');
    }

    // 设置响应头
    res
      .status(HttpStatus.PARTIAL_CONTENT)
      .set({
        'Content-Range': `bytes ${start}-${end}/${fileMeta.fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileMeta.originalFileName}"`,
      })
      .sendFile(filePath, {
        headers: {
          Range: `bytes=${start}-${end}`,
        },
        start, // 设置从文件流的哪个位置开始读取
        end, // 设置读取的结束位置
      });
  }
}
