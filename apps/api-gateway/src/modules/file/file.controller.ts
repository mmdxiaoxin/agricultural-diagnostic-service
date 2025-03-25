import { Roles } from '@common/decorator/roles.decorator';
import { AuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { ParseNumberArrayPipe } from '@common/pipe/array-number.pipe';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@shared/enum/role.enum';
import {
  DOWNLOAD_SERVICE_NAME,
  FILE_SERVICE_NAME,
  UPLOAD_SERVICE_NAME,
} from 'config/microservice.config';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';

import { CompleteChunkDto } from '@common/dto/file/complete-chunk.dto';
import { CreateTempLinkDto } from '@common/dto/file/create-link.dto';
import { CreateTaskDto } from '@common/dto/file/create-task.dto';
import { DownloadFilesDto } from '@common/dto/file/download-file.dto';
import {
  UpdateFileDto,
  UpdateFilesAccessDto,
} from '@common/dto/file/update-file.dto';
import { UploadChunkDto } from '@common/dto/file/upload-chunk.dto';
import { FileGuard } from '../file/guards/file.guard';
import { FileService } from './file.service';
import { FilesGuard } from './guards/files.guard';
import { FileSizeValidationPipe } from './pipe/file-size.pipe';
import { ParseFileTypePipe } from './pipe/type.pipe';

export interface DownloadService {
  // 定义一个接收 DownloadRequest，返回流式数据的接口
  downloadFile(data: { fileId: number }): Observable<{ data: Buffer }>;
}

@ApiTags('文件模块')
@Controller('file')
export class FileController {
  private readonly logger = new Logger(FileController.name);

  constructor(
    @Inject(UPLOAD_SERVICE_NAME) private readonly uploadClient: ClientProxy,
    @Inject(FILE_SERVICE_NAME) private readonly fileClient: ClientProxy,
    @Inject(DOWNLOAD_SERVICE_NAME) private readonly downloadClient: ClientProxy,
    private readonly fileService: FileService,
  ) {}

  // 获取空间使用信息
  @Get('disk-usage')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  async diskUsageGet(@Req() req: Request) {
    return this.fileService.getDiskUsage(req.user.userId);
  }

  // 获取文件列表
  @Get()
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  async filesGet(@Req() req: Request) {
    return this.fileService.getFiles(req.user.userId);
  }

  // 获取文件列表分页
  @Get('list')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  async fileListGet(
    @Req() req: Request,
    @Query('page', ParseIntPipe) page?: number,
    @Query('pageSize', ParseIntPipe) pageSize?: number,
    @Query('fileType', ParseFileTypePipe) fileType?: string[],
    @Query('originalFileName') originalFileName?: string,
    @Query('createdStart') createdStart?: string,
    @Query('createdEnd') createdEnd?: string,
    @Query('updatedStart') updatedStart?: string,
    @Query('updatedEnd') updatedEnd?: string,
  ) {
    return this.fileService.getFileList({
      userId: req.user.userId,
      page,
      pageSize,
      fileType,
      originalFileName,
      createdStart,
      createdEnd,
      updatedStart,
      updatedEnd,
    });
  }

  // 单文件上传
  @Post('upload/single')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(
    @Req() req: Request,
    @UploadedFile(new FileSizeValidationPipe('10MB')) file: Express.Multer.File,
  ) {
    return this.fileService.uploadSingle(file, req.user.userId);
  }

  // 创建上传任务
  @Post('upload/create')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async createUploadTask(@Req() req: Request, @Body() dto: CreateTaskDto) {
    return this.fileService.createUploadTask(dto, req.user.userId);
  }

  // 查询上传任务状态
  @Get('upload/status/:taskId')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  async getUploadTaskStatus(@Param('taskId') taskId: string) {
    return this.fileService.getUploadTaskStatus(taskId);
  }

  // 合并分片
  @Post('upload/complete')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  async completeUpload(@Body() dto: CompleteChunkDto) {
    return this.fileService.completeUpload(dto);
  }

  // 文件分片上传
  @Post('upload/chunk')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('chunk'))
  async uploadChunk(
    @UploadedFile(new FileSizeValidationPipe('10MB')) file: Express.Multer.File,
    @Body() dto: UploadChunkDto,
  ) {
    return this.fileService.uploadChunk(file, dto);
  }

  // 文件下载
  @Get('download/:fileId')
  @Roles(Role.Admin, Role.Expert, Role.User)
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
    return this.fileService.downloadFile(req.fileMeta, res);
  }

  // 批量文件下载
  @Post('download')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard, FilesGuard)
  async downloadFiles(
    @Body() _: DownloadFilesDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.fileService.downloadFiles(req.filesMeta, res);
  }

  // 文件修改
  @Put('update')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  async updateFile(@Req() req: Request, @Body() dto: UpdateFileDto) {
    return this.fileService.updateFile(dto, req.user.userId);
  }

  // 批量文件权限修改
  @Put('access')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  async updateFilesAccess(
    @Req() req: Request,
    @Body() dto: UpdateFilesAccessDto,
  ) {
    return this.fileService.updateFilesAccess(dto, req.user.userId);
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
    @Req() req: Request,
  ) {
    return this.fileService.deleteFile(fileId, req.user.userId);
  }

  // 批量文件删除接口
  @Delete('delete')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFiles(
    @Query('fileIds', ParseNumberArrayPipe) fileIds: number[],
    @Req() req: Request,
  ) {
    return this.fileService.deleteFiles(fileIds, req.user.userId);
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
    // return this.downloadService.generateAccessLink(fileId, req, dto);
  }

  // 获取临时访问链接
  @Get('access-link/:token')
  async getAccessLink(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // const fileId = this.downloadService.verifyAccessLink(token);
    // const fileMeta = await this.commonService.findById(fileId);
    // return this.downloadService.downloadFile(fileMeta, req, res);
  }
}
