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
  HttpStatus,
  Inject,
  InternalServerErrorException,
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
import { UPLOAD_SERVICE_NAME } from 'config/microservice.config';
import { Request, Response } from 'express';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { CompleteChunkDto } from '../../../../../packages/common/src/dto/file/complete-chunk.dto';
import { CreateTempLinkDto } from '../../../../../packages/common/src/dto/file/create-link.dto';
import { CreateTaskDto } from '../../../../../packages/common/src/dto/file/create-task.dto';
import { DownloadFilesDto } from '../../../../../packages/common/src/dto/file/download-file.dto';
import {
  UpdateFileDto,
  UpdateFilesAccessDto,
} from '../../../../../packages/common/src/dto/file/update-file.dto';
import { UploadChunkDto } from '../../../../../packages/common/src/dto/file/upload-chunk.dto';
import { FileGuard, FilesGuard } from '../file/guards/file.guard';
import { ParseFileIdsPipe } from './pipe/delete.pipe';
import { FileSizeValidationPipe } from './pipe/file-size.pipe';
import { ParseFileTypePipe } from './pipe/type.pipe';
import { FileDownloadService } from './services/file-download.service';
import { FileManageService } from './services/file-manage.service';
import { FileStorageService } from './services/file-storage.service';
import { FileUploadService } from './services/file-upload.service';
import { FileService } from './services/file.service';

@ApiTags('文件模块')
@Controller('file')
@UseFilters(TypeormFilter)
export class FileController {
  constructor(
    private readonly commonService: FileService,
    private readonly downloadService: FileDownloadService,
    private readonly uploadService: FileUploadService,
    private readonly manageService: FileManageService,
    private readonly storageService: FileStorageService,
    @Inject(UPLOAD_SERVICE_NAME) private readonly uploadClient: ClientProxy,
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
    return this.commonService.filesGet(req.user.userId);
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
    return this.commonService.filesListGet(
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
    const fileMeta = req.fileMeta;
    return this.downloadService.downloadFile(fileMeta, req, res);
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
    return this.downloadService.downloadFilesAsZip(filesMeta, res);
  }

  // 文件修改
  @Put('update')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  async updateFile(@Req() req: Request, @Body() dto: UpdateFileDto) {
    return this.manageService.updateFile(req.user.userId, dto);
  }

  // 批量文件权限修改
  @Put('access')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  async updateFilesAccess(
    @Req() req: Request,
    @Body() dto: UpdateFilesAccessDto,
  ) {
    return this.manageService.updateFilesAccess(req.user.userId, dto);
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
    return this.manageService.deleteFile(fileId, req.user.userId);
  }

  // 批量文件删除接口
  @Delete('delete')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFiles(@Query('fileIds', ParseFileIdsPipe) fileIds: number[]) {
    await this.manageService.deleteFiles(fileIds);
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
    return this.downloadService.generateAccessLink(fileId, req, dto);
  }

  // 获取临时访问链接
  @Get('access-link/:token')
  async getAccessLink(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const fileId = this.downloadService.verifyAccessLink(token);
    const fileMeta = await this.commonService.findById(fileId);
    return this.downloadService.downloadFile(fileMeta, req, res);
  }
}
