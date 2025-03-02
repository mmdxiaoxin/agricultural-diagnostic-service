import { Roles } from '@/common/decorator/roles.decorator';
import { Role } from '@/common/enum/role.enum';
import { TypeormFilter } from '@/common/filters/typeorm.filter';
import { AuthGuard } from '@/common/guards/auth.guard';
import { FileGuard, FilesGuard } from '@/common/guards/file.guard';
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
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { unlink } from 'fs/promises';
import { diskStorage } from 'multer';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CompleteChunkDto } from './dto/complete-chunk.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { UploadChunkDto } from './dto/upload-chunk.dto';
import { FileService } from './file.service';
import { FileSizeValidationPipe } from './pipe/file.pipe';

@Controller('file')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(TypeormFilter)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  // 获取空间使用信息
  @Get('disk-usage')
  async diskUsageGet(@Req() req: Request) {
    return this.fileService.diskUsageGet(req.user.userId);
  }

  // 获取文件列表
  @Get('list')
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
  @HttpCode(HttpStatus.CREATED)
  async createUploadTask(@Req() req: Request, @Body() dto: CreateTaskDto) {
    return this.fileService.createUploadTask(req.user.userId, dto);
  }

  // 查询上传任务状态
  @Get('upload/status/:taskId')
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
  async completeUpload(@Req() req: Request, @Body() dto: CompleteChunkDto) {
    return this.fileService.completeUpload(req.user.userId, dto.taskId);
  }

  // 文件分片上传
  @Post('upload/chunk')
  @UseInterceptors(
    FileInterceptor('file', {
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
  @UseGuards(FileGuard)
  async downloadFile(
    @Param(
      'fileId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    fileId: number,
  ) {
    // return this.fileService.downloadFile(fileId);
  }

  // 批量文件下载
  @Post('download')
  @UseGuards(FilesGuard)
  async downloadFiles(@Body() fileIds: string[]) {
    // return this.fileService.downloadFiles(fileIds);
  }

  // 文件修改
  @Put('update')
  async updateFile(@Body() dto: UpdateFileDto) {
    return this.fileService.updateFile(dto);
  }

  // 批量文件权限修改
  @Put('access')
  async updateFilesAccess(@Body() filesAccessDto: any) {
    // return this.fileService.updateFilesAccess(filesAccessDto);
  }

  // 文件删除
  @Delete('delete/:fileId')
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
  async generateAccessLink(@Param('fileId') fileId: string) {
    // return this.fileService.generateAccessLink(fileId);
  }
}
