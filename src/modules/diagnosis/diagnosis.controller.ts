import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { MIME_TYPE } from '@/common/enum/mime.enum';
import { AuthGuard } from '@/common/guards/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { FileSizeValidationPipe } from '../file/pipe/file-size.pipe';
import { FileTypeValidationPipe } from '../file/pipe/file-type.pipe';
import { FileOperationService } from '../file/services/file-operation.service';
import { DiagnosisService } from './diagnosis.service';

@Controller('diagnosis')
@UseGuards(AuthGuard)
export class DiagnosisController {
  constructor(
    private readonly diagnosisService: DiagnosisService,
    private readonly fileOperationService: FileOperationService,
  ) {}

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
    @UploadedFile(
      new FileTypeValidationPipe([MIME_TYPE.PNG, MIME_TYPE.JPEG]),
      new FileSizeValidationPipe('10MB'),
    )
    file: Express.Multer.File,
  ) {
    try {
      return this.diagnosisService.uploadData(req.user.userId, file);
    } catch (error) {
      await this.fileOperationService.deleteFile(file.path);
      throw error;
    }
  }

  // TODO: 开始诊断数据接口
  @Post(':id/start')
  async startDiagnosis(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return await this.diagnosisService.startDiagnosis(id);
  }

  // 获取诊断服务状态接口
  @Get(':id/status')
  async getDiagnosisStatus(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return await this.diagnosisService.getDiagnosisStatus(id);
  }

  // 获取诊断历史记录接口
  @Get('history')
  async diagnosisHistoryGet(@Req() req: Request) {
    return await this.diagnosisService.diagnosisHistoryGet(req.user.userId);
  }

  // 获取诊断历史记录接口
  @Get('history/list')
  async diagnosisHistoryListGet(
    @Req() req: Request,
    @Query('page', ParseIntPipe) page?: number,
    @Query('pageSize', ParseIntPipe) pageSize?: number,
  ) {
    return await this.diagnosisService.diagnosisHistoryListGet(
      page,
      pageSize,
      req.user.userId,
    );
  }
}
