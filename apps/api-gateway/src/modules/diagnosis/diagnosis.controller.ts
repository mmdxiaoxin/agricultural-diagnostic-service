import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { AuthGuard } from '@common/guards/auth.guard';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { MIME_TYPE } from '@shared/enum/mime.enum';
import { formatResponse } from '@shared/helpers/response.helper';
import { UPLOAD_SERVICE_NAME } from 'config/microservice.config';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { FileSizeValidationPipe } from '../file/pipe/file-size.pipe';
import { FileTypeValidationPipe } from '../file/pipe/file-type.pipe';
import { DiagnosisService } from './diagnosis.service';

@ApiTags('病害诊断模块')
@Controller('diagnosis')
@UseGuards(AuthGuard)
export class DiagnosisController {
  constructor(
    private readonly diagnosisService: DiagnosisService,
    @Inject(UPLOAD_SERVICE_NAME)
    private readonly uploadClient: ClientProxy,
  ) {}

  // 上传待诊断数据接口
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadData(
    @Req() req: Request,
    @UploadedFile(
      new FileTypeValidationPipe([MIME_TYPE.PNG, MIME_TYPE.JPEG]),
      new FileSizeValidationPipe('5MB'),
    )
    file: Express.Multer.File,
  ) {
    const upload = await firstValueFrom(
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
    return formatResponse(200, upload, '上传成功');
  }

  // TODO: 开始诊断数据接口
  @Post(':id/start')
  async startDiagnosis(
    @Req() req: Request,
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return await this.diagnosisService.startDiagnosis(id, req.user.userId);
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

  // 获取诊断支持接口
  @Get('support')
  async diagnosisSupportGet() {
    return await this.diagnosisService.diagnosisSupportGet();
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
