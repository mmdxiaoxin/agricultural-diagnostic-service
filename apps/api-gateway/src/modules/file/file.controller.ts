import { Roles } from '@common/decorator/roles.decorator';
import { TypeormFilter } from '@common/filters/typeorm.filter';
import { AuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  Logger,
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
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@shared/enum/role.enum';
import { formatResponse } from '@shared/helpers/response.helper';
import {
  DOWNLOAD_SERVICE_NAME,
  FILE_SERVICE_NAME,
  UPLOAD_SERVICE_NAME,
} from 'config/microservice.config';
import { Request, Response } from 'express';
import {
  defaultIfEmpty,
  firstValueFrom,
  lastValueFrom,
  Observable,
} from 'rxjs';
import { CompleteChunkDto } from '../../../../../packages/common/src/dto/file/complete-chunk.dto';
import { CreateTempLinkDto } from '../../../../../packages/common/src/dto/file/create-link.dto';
import { CreateTaskDto } from '../../../../../packages/common/src/dto/file/create-task.dto';
import { DownloadFilesDto } from '../../../../../packages/common/src/dto/file/download-file.dto';
import {
  UpdateFileDto,
  UpdateFilesAccessDto,
} from '../../../../../packages/common/src/dto/file/update-file.dto';
import { UploadChunkDto } from '../../../../../packages/common/src/dto/file/upload-chunk.dto';
import { FileGuard } from '../file/guards/file.guard';
import { FilesGuard } from './guards/files.guard';
import { ParseFileIdsPipe } from './pipe/delete.pipe';
import { FileSizeValidationPipe } from './pipe/file-size.pipe';
import { ParseFileTypePipe } from './pipe/type.pipe';
import { FileStorageService } from './services/file-storage.service';

export interface DownloadService {
  // 定义一个接收 DownloadRequest，返回流式数据的接口
  downloadFile(data: { fileId: number }): Observable<{ data: Buffer }>;
}

@ApiTags('文件模块')
@Controller('file')
@UseFilters(TypeormFilter)
export class FileController {
  private readonly logger = new Logger(FileController.name);

  constructor(
    private readonly storageService: FileStorageService,
    @Inject(UPLOAD_SERVICE_NAME) private readonly uploadClient: ClientProxy,
    @Inject(FILE_SERVICE_NAME) private readonly fileClient: ClientProxy,
    @Inject(DOWNLOAD_SERVICE_NAME) private readonly downloadClient: ClientProxy,
  ) {}

  // 获取空间使用信息
  @Get('disk-usage')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  async diskUsageGet(@Req() req: Request) {
    return this.storageService.diskUsageGet(req.user.userId);
  }

  // 获取文件列表
  @Get()
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  async filesGet(@Req() req: Request) {
    const rpcResponse = await lastValueFrom(
      this.fileClient.send({ cmd: 'files.get' }, { userId: req.user.userId }),
    );
    return formatResponse(200, rpcResponse?.result, '文件列表查询成功');
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
    const filters = {
      fileType,
      originalFileName,
      createdStart,
      createdEnd,
      updatedStart,
      updatedEnd,
    };
    const rpcResponse = await lastValueFrom(
      this.fileClient.send(
        { cmd: 'files.get.list' },
        {
          page,
          pageSize,
          filters,
          userId: req.user.userId,
        },
      ),
    );
    return formatResponse(200, rpcResponse?.result, '文件列表查询成功');
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
    try {
      const rpcResponse = await firstValueFrom(
        this.uploadClient.send(
          { cmd: 'upload.single' },
          {
            fileMeta: {
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
            },
            fileData: file.buffer.toString('base64'),
            userId: req.user.userId,
          },
        ),
      );
      return formatResponse(200, rpcResponse, '上传成功');
    } catch (error) {
      throw error;
    }
  }

  // 创建上传任务
  @Post('upload/create')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async createUploadTask(@Req() req: Request, @Body() dto: CreateTaskDto) {
    const preloadResponse = await lastValueFrom(
      this.uploadClient.send(
        { cmd: 'upload.preload' },
        {
          fileMd5: dto.fileMd5,
          originalFileName: dto.fileName,
          userId: req.user.userId,
        },
      ),
    );
    if (!preloadResponse) {
      throw new InternalServerErrorException('文件预加载失败');
    }
    if (preloadResponse.success) {
      return formatResponse(200, preloadResponse, '文件已快速上传');
    }
    const createResponse = await firstValueFrom(
      this.uploadClient.send(
        { cmd: 'task.create' },
        {
          ...dto,
          userId: req.user.userId,
        },
      ),
    );
    return formatResponse(201, createResponse, '任务创建成功');
  }

  // 查询上传任务状态
  @Get('upload/status/:taskId')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  async getUploadTaskStatus(
    @Param('taskId')
    taskId: string,
  ) {
    const rpcResponse = await lastValueFrom(
      this.uploadClient.send({ cmd: 'task.get' }, { taskId }),
    );
    return formatResponse(200, rpcResponse?.result, '任务查询成功');
  }

  // 合并分片
  @Post('upload/complete')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  async completeUpload(@Body() dto: CompleteChunkDto) {
    const rpcResponse = await lastValueFrom(
      this.uploadClient.send(
        { cmd: 'upload.complete' },
        { taskId: dto.taskId },
      ),
    );
    return formatResponse(200, rpcResponse?.result, '上传成功');
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
    const rpcResponse = await lastValueFrom(
      this.uploadClient.send(
        { cmd: 'upload.chunk' },
        {
          taskMeta: dto,
          chunkData: file.buffer.toString('base64'),
        },
      ),
    );
    return formatResponse(200, rpcResponse?.result, '上传成功');
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
    try {
      const fileMeta = req.fileMeta;
      // 通过 TCP 请求 file.download
      const response = await lastValueFrom(
        this.downloadClient.send({ cmd: 'file.download' }, { fileMeta }),
      );

      if (!response.success || !response.data) {
        throw new HttpException(
          response.message || '文件获取失败',
          HttpStatus.NOT_FOUND,
        );
      }

      // 将 Base64 转换为 Buffer
      const fileBuffer = Buffer.from(response.data, 'base64');

      // 设定 HTTP 头信息
      res.set({
        'Content-Disposition': `attachment; filename="${fileMeta.originalFileName}"`,
        'Content-Type': fileMeta.fileType || 'application/octet-stream',
      });

      // 直接写入流
      res.end(fileBuffer);
    } catch (err) {
      this.logger.error(`下载失败: ${err}`);
      throw new InternalServerErrorException('文件下载失败');
    }
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
    const filesMeta = req.filesMeta;
    const response = await lastValueFrom(
      this.downloadClient.send({ cmd: 'files.download' }, { filesMeta }),
    );
    if (!response.success || !response.data) {
      throw new HttpException(
        response.message || '文件获取失败',
        HttpStatus.NOT_FOUND,
      );
    }
    const fileBuffer = Buffer.from(response.data, 'base64');
    // 设定 HTTP 头信息
    res.set({
      'Content-Type': 'application/zip',
    });
    // 直接写入流
    res.end(fileBuffer);
  }

  // 文件修改
  @Put('update')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  async updateFile(@Req() req: Request, @Body() dto: UpdateFileDto) {
    await firstValueFrom(
      this.fileClient.send(
        { cmd: 'file.update' },
        {
          userId: req.user.userId,
          dto,
        },
      ),
    );
    return formatResponse(200, null, '文件修改成功');
  }

  // 批量文件权限修改
  @Put('access')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  async updateFilesAccess(
    @Req() req: Request,
    @Body() dto: UpdateFilesAccessDto,
  ) {
    await firstValueFrom(
      this.fileClient.send(
        { cmd: 'files.update.access' },
        {
          userId: req.user.userId,
          dto,
        },
      ),
    );
    return formatResponse(200, null, '权限修改成功');
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
    return this.fileClient
      .send(
        {
          cmd: 'file.delete',
        },
        {
          fileId,
          userId: req.user.userId,
        },
      )
      .pipe(defaultIfEmpty(null));
  }

  // 批量文件删除接口
  @Delete('delete')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFiles(
    @Query('fileIds', ParseFileIdsPipe) fileIds: number[],
    @Req() req: Request,
  ) {
    return this.fileClient
      .send(
        {
          cmd: 'files.delete',
        },
        {
          fileIds,
          userId: req.user.userId,
        },
      )
      .pipe(defaultIfEmpty(null));
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
