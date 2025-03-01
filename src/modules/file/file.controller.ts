import { Roles } from '@/common/decorator/roles.decorator';
import { Role } from '@/common/enum/role.enum';
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { FileService } from './file.service'; // 假设你的文件处理逻辑在文件服务中

@Controller('file')
@Roles(Role.Admin, Role.Expert)
@UseGuards(AuthGuard, RolesGuard)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  // 获取文件空间信息
  @Get('disk-usage')
  async getSpaceInfo() {
    // return this.fileService.getSpaceInfo();
  }

  // 获取文件列表
  @Get('list')
  async getFileList() {
    // return this.fileService.getFileList();
  }

  // 单文件上传
  @Post('upload/single')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          // 根据文件 MIME 类型选择不同的文件夹
          let folder = 'uploads/other'; // 默认存储在 "other" 文件夹
          const mimeType = file.mimetype;

          // 按 MIME 类型分文件夹存储
          if (mimeType.startsWith('image')) {
            folder = 'uploads/images'; // 存储图片文件
          } else if (mimeType.startsWith('video')) {
            folder = 'uploads/videos'; // 存储视频文件
          } else if (mimeType.startsWith('application')) {
            folder = 'uploads/documents'; // 存储文档文件
          } else if (mimeType.startsWith('audio')) {
            folder = 'uploads/audio'; // 存储音频文件
          }

          // 确保文件夹存在，如果没有则创建
          const fs = require('fs');
          if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
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
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const fs = require('fs');
          if (!fs.existsSync('uploads/chunks')) {
            fs.mkdirSync('uploads/chunks', { recursive: true });
          }
          cb(null, 'uploads/chunks');
        },
        filename: (req, file, cb) => {
          // @ts-ignore //FIXME
          const { task_id, chunkIndex } = req.body;
          if (!task_id || !chunkIndex) {
            return cb(
              new Error('Missing task_id or chunkIndex'),
              file.filename,
            );
          }
          cb(null, `${task_id}-${chunkIndex}`);
        },
      }),
    }),
  )
  async uploadChunk(@UploadedFile() file: Express.Multer.File) {
    // return this.fileService.uploadChunk(file);
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
