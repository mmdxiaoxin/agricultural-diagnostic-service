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
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileService } from './file.service';
import { ChunkFileInterceptor } from './interceptor/chunk.interceptor';
import { SingleFileInterceptor } from './interceptor/single.interceptor';

@Controller('file')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(TypeormFilter)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  // 获取文件空间信息
  @Get('disk-usage')
  async getSpaceInfo(@Req() req) {
    const user = req.user;
    try {
      const data = await this.fileService.computeDiskUsage(user);
      return {
        code: 200,
        data,
        message: '获取文件空间信息成功',
      };
    } catch (error) {
      throw error;
    }
  }

  // 获取文件列表
  @Get('list')
  async getFileList() {
    // return this.fileService.getFileList();
  }

  // 单文件上传
  @Post('upload/single')
  @UseInterceptors(SingleFileInterceptor)
  async uploadSingle(@UploadedFile() file: Express.Multer.File) {
    // return this.fileService.uploadSingle(file);
  }

  // 创建上传任务
  @Post('upload/create')
  async createUploadTask(@Body() taskDetails: any) {
    // return this.fileService.createUploadTask(taskDetails);
  }

  // 查询上传任务状态
  @Get('upload/status/:taskId')
  async getUploadTaskStatus(@Param('taskId') taskId: string) {
    // return this.fileService.getUploadTaskStatus(taskId);
  }

  // 合并分片
  @Post('upload/complete')
  async completeUpload(@Body() taskDetails: any) {
    // return this.fileService.completeUpload(taskDetails);
  }

  // 文件分片上传
  @Post('upload/chunk')
  @UseInterceptors(ChunkFileInterceptor)
  async uploadChunk(@UploadedFile() file: Express.Multer.File) {
    //  return this.fileService.uploadChunk(file);
  }

  // 文件下载
  @Get('download/:fileId')
  @UseGuards(FileGuard)
  async downloadFile(@Param('fileId') fileId: string) {
    // return this.fileService.downloadFile(fileId);
  }

  // 批量文件下载
  @Post('download')
  @UseGuards(FilesGuard)
  async downloadFiles(@Body() fileIds: string[]) {
    // return this.fileService.downloadFiles(fileIds);
  }

  // 文件修改
  @Put('update/:fileId')
  async updateFile(
    @Param('fileId') fileId: string,
    @Body() updateFileDto: any,
  ) {
    // return this.fileService.updateFile(fileId, updateFileDto);
  }

  // 批量文件权限修改
  @Put('access')
  async updateFilesAccess(@Body() filesAccessDto: any) {
    // return this.fileService.updateFilesAccess(filesAccessDto);
  }

  // 文件删除
  @Delete('delete/:fileId')
  async deleteFile(@Param('fileId') fileId: string) {
    // return this.fileService.deleteFile(fileId);
  }

  // 生成临时访问链接
  @Post('generate-link/:fileId')
  async generateAccessLink(@Param('fileId') fileId: string) {
    // return this.fileService.generateAccessLink(fileId);
  }
}
