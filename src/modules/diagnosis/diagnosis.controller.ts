import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { FileSizeValidationPipe } from '../file/pipe/file-size.pipe';
import { FileTypeValidationPipe } from '../file/pipe/file-type.pipe';
import { DiagnosisService } from './services/diagnosis.service';

@Controller('diagnosis')
export class DiagnosisController {
  constructor(private readonly diagnosisService: DiagnosisService) {}

  // 上传待诊断数据接口
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          let folder = 'uploads/other';
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
          file.originalname = Buffer.from(file.originalname, 'latin1').toString(
            'utf-8',
          );
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async uploadData(
    @Req() req: Request,
    @Body() dto: any,
    @UploadedFile(
      new FileTypeValidationPipe(['image/jpeg', 'image/png']),
      new FileSizeValidationPipe('10MB'),
    )
    file: Express.Multer.File,
  ) {
    return await this.diagnosisService.uploadData(req.user.userId, dto);
  }

  // 开始诊断数据接口
  @Post(':id/start')
  async startDiagnosis(@Param('id') id: number) {
    return await this.diagnosisService.startDiagnosis(id);
  }

  // 获取诊断服务状态接口
  @Get(':id/status')
  async getDiagnosisStatus(@Param('id') id: number) {
    return await this.diagnosisService.getDiagnosisStatus(id);
  }

  // 获取诊断历史记录接口
  @Get('history')
  async getDiagnosisHistory(@Query('userId') userId: number) {
    return await this.diagnosisService.getDiagnosisHistory(userId);
  }
}
