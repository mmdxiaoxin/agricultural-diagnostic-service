import {
  ApiBinaryResponse,
  ApiErrorResponse,
  ApiNullResponse,
  ApiResponse,
} from '@common/decorator/api-response.decorator';
import { Roles } from '@common/decorator/roles.decorator';
import { CompleteChunkDto } from '@common/dto/file/complete-chunk.dto';
import { CreateTaskDto } from '@common/dto/file/create-task.dto';
import { DownloadFilesDto } from '@common/dto/file/download-file.dto';
import { DownloadTokenDto } from '@common/dto/file/download-token.dto';
import { FileQueryDto } from '@common/dto/file/file-query.dto';
import { FileDto } from '@common/dto/file/file.dto';
import {
  UpdateFileDto,
  UpdateFilesAccessDto,
} from '@common/dto/file/update-file.dto';
import { UploadChunkDto } from '@common/dto/file/upload-chunk.dto';
import { UploadTaskDto } from '@common/dto/file/upload-task.dto';
import { createPageResponseDto } from '@common/dto/page-response.dto';
import { AuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { ParseNumberArrayPipe } from '@common/pipe/array-number.pipe';
import { FileSizeValidationPipe } from '@common/pipe/file-size.pipe';
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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@shared/enum/role.enum';
import { Request, Response } from 'express';
import { FileGuard } from '../file/guards/file.guard';
import { FileService } from './file.service';
import { FilesGuard } from './guards/files.guard';

@ApiTags('文件模块')
@Controller('file')
@ApiBearerAuth()
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get('disk-usage')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({
    summary: '获取磁盘使用情况',
    description: '获取系统磁盘使用情况（仅管理员和专家可访问）',
  })
  @ApiResponse(HttpStatus.OK, '获取成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  async diskUsageGet(@Req() req: Request) {
    return this.fileService.findDisk(req.user.userId);
  }

  @Get()
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({
    summary: '获取所有文件',
    description: '获取系统中的所有文件列表（仅管理员和专家可访问）',
  })
  @ApiResponse(HttpStatus.OK, '获取成功', FileDto, true)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  async filesGet(@Req() req: Request) {
    return this.fileService.findAll(req.user.userId);
  }

  @Get('list')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({
    summary: '获取文件列表',
    description: '分页获取系统中的文件列表（仅管理员和专家可访问）',
  })
  @ApiResponse(HttpStatus.OK, '获取成功', createPageResponseDto(FileDto))
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  async fileListGet(@Req() req: Request, @Query() query: FileQueryDto) {
    return this.fileService.findList(req.user.userId, query);
  }

  @Post('upload/single')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: '单文件上传',
    description: '上传单个文件（仅管理员和专家可访问）',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '文件（最大5MB）',
        },
      },
    },
  })
  @ApiResponse(HttpStatus.CREATED, '上传成功', FileDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '文件大小超出限制')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  async uploadSingle(
    @Req() req: Request,
    @UploadedFile(new FileSizeValidationPipe('5MB')) file: Express.Multer.File,
  ) {
    return this.fileService.uploadSingle(file, req.user.userId);
  }

  @Post('upload/create')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '创建上传任务',
    description: '创建大文件分片上传任务（仅管理员和专家可访问）',
  })
  @ApiResponse(HttpStatus.CREATED, '创建成功', UploadTaskDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  async createUploadTask(@Req() req: Request, @Body() dto: CreateTaskDto) {
    return this.fileService.createUploadTask(dto, req.user.userId);
  }

  @Get('upload/status/:taskId')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({
    summary: '获取上传任务状态',
    description: '获取文件上传任务的状态（仅管理员和专家可访问）',
  })
  @ApiParam({ name: 'taskId', description: '上传任务ID', type: 'string' })
  @ApiResponse(HttpStatus.OK, '获取成功', UploadTaskDto)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '任务不存在')
  async getUploadTaskStatus(@Param('taskId') taskId: string) {
    return this.fileService.getUploadTaskStatus(taskId);
  }

  @Post('upload/complete')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({
    summary: '完成分片上传',
    description: '合并所有分片完成文件上传（仅管理员和专家可访问）',
  })
  @ApiNullResponse(HttpStatus.OK, '合并成功')
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  async completeUpload(@Body() dto: CompleteChunkDto) {
    return this.fileService.completeUpload(dto);
  }

  @Post('upload/chunk')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('chunk'))
  @ApiOperation({
    summary: '上传分片',
    description: '上传文件分片（仅管理员和专家可访问）',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: '任务ID',
        },
        chunkIndex: {
          type: 'number',
          description: '分片序号',
        },
        fileMd5: {
          type: 'string',
          description: '文件MD5',
        },
        chunk: {
          type: 'string',
          format: 'binary',
          description: '文件分片（最大10MB）',
        },
      },
    },
  })
  @ApiNullResponse(HttpStatus.CREATED, '上传成功')
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '分片大小超出限制')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  async uploadChunk(
    @UploadedFile(new FileSizeValidationPipe('10MB')) file: Express.Multer.File,
    @Body() dto: UploadChunkDto,
  ) {
    return this.fileService.uploadChunk(file, dto);
  }

  @Get('download/:fileId')
  @Roles(Role.Admin, Role.Expert, Role.User)
  @UseGuards(AuthGuard, RolesGuard, FileGuard)
  @ApiOperation({ summary: '下载文件', description: '下载指定文件' })
  @ApiParam({ name: 'fileId', description: '文件ID', type: 'number' })
  @ApiBinaryResponse(HttpStatus.OK, '获取成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '文件不存在')
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

  @Post('download')
  @Roles(Role.Admin, Role.Expert, Role.User)
  @UseGuards(AuthGuard, RolesGuard, FilesGuard)
  @ApiOperation({ summary: '批量下载文件', description: '批量下载多个文件' })
  @ApiBinaryResponse(HttpStatus.OK, '获取成功')
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  async downloadFiles(
    @Body() _: DownloadFilesDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.fileService.downloadFiles(req.filesMeta, res);
  }

  @Put('update')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({
    summary: '更新文件信息',
    description: '更新文件的基本信息（仅管理员和专家可访问）',
  })
  @ApiResponse(HttpStatus.OK, '更新成功')
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '文件不存在')
  async updateFile(@Req() req: Request, @Body() dto: UpdateFileDto) {
    return this.fileService.updateFile(dto, req.user.userId);
  }

  @Put('access')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiOperation({
    summary: '批量更新文件权限',
    description: '批量更新多个文件的访问权限（仅管理员和专家可访问）',
  })
  @ApiResponse(HttpStatus.OK, '更新成功')
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  async updateFilesAccess(
    @Req() req: Request,
    @Body() dto: UpdateFilesAccessDto,
  ) {
    return this.fileService.updateFilesAccess(dto, req.user.userId);
  }

  @Delete('delete/:fileId')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '删除文件',
    description: '删除指定的文件（仅管理员和专家可访问）',
  })
  @ApiParam({ name: 'fileId', description: '文件ID', type: 'number' })
  @ApiNullResponse(HttpStatus.NO_CONTENT, '删除成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '文件不存在')
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

  @Delete('delete')
  @Roles(Role.Admin, Role.Expert)
  @UseGuards(AuthGuard, RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '批量删除文件',
    description: '批量删除多个文件（仅管理员和专家可访问）',
  })
  @ApiQuery({ name: 'fileIds', description: '文件ID列表', type: [Number] })
  @ApiNullResponse(HttpStatus.NO_CONTENT, '删除成功')
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  async deleteFiles(
    @Query('fileIds', ParseNumberArrayPipe) fileIds: number[],
    @Req() req: Request,
  ) {
    return this.fileService.deleteFiles(fileIds, req.user.userId);
  }

  @Get('download-token/:fileId')
  @Roles(Role.Admin, Role.Expert, Role.User)
  @UseGuards(AuthGuard, RolesGuard, FileGuard)
  @ApiOperation({
    summary: '获取下载令牌',
    description: '获取文件的临时下载令牌',
  })
  @ApiParam({ name: 'fileId', description: '文件ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '获取成功', DownloadTokenDto)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '文件不存在')
  async generateAccessToken(
    @Req() req: Request,
    @Param(
      'fileId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    _: number,
  ) {
    return this.fileService.generateAccessToken(req);
  }

  @Get('access-link/:token')
  @ApiOperation({
    summary: '获取访问链接',
    description: '使用临时令牌获取文件访问链接',
  })
  @ApiParam({ name: 'token', description: '临时访问令牌', type: 'string' })
  @ApiBinaryResponse(HttpStatus.OK, '获取成功')
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '令牌无效')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '文件不存在')
  async getAccessLink(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.fileService.getAccessLink(token, req, res);
  }
}
