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

import { File as FileEntity } from '@app/database/entities';
import { AuthGuard } from '@common/guards/auth.guard';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { DIAGNOSIS_MESSAGE_PATTERNS } from '@shared/constants/diagnosis-message-patterns';
import { MIME_TYPE } from '@shared/enum/mime.enum';
import { formatResponse } from '@shared/helpers/response.helper';
import {
  DIAGNOSIS_SERVICE_NAME,
  UPLOAD_SERVICE_NAME,
} from 'config/microservice.config';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { FileSizeValidationPipe } from '../file/pipe/file-size.pipe';
import { FileTypeValidationPipe } from '../file/pipe/file-type.pipe';
@ApiTags('病害诊断模块')
@Controller('diagnosis')
@UseGuards(AuthGuard)
export class DiagnosisController {
  constructor(
    @Inject(UPLOAD_SERVICE_NAME)
    private readonly uploadClient: ClientProxy,

    @Inject(DIAGNOSIS_SERVICE_NAME)
    private readonly diagnosisClient: ClientProxy,
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
    const fileRes = await firstValueFrom(
      this.uploadClient.send<{
        success: boolean;
        result: FileEntity;
      }>(
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
    await firstValueFrom(
      this.diagnosisClient.send(
        { cmd: DIAGNOSIS_MESSAGE_PATTERNS.CREATE },
        {
          userId: req.user.userId,
          fileId: fileRes.result.id,
        },
      ),
    );
    return formatResponse(200, null, '上传成功');
  }

  @Post(':id/start')
  async startDiagnosis(
    @Req() req: Request,
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    const { success, result } = await firstValueFrom(
      this.diagnosisClient.send<{ success: boolean; result: any }>(
        { cmd: DIAGNOSIS_MESSAGE_PATTERNS.START },
        {
          diagnosisId: id,
          userId: req.user.userId,
        },
      ),
    );
    if (!success) {
      return formatResponse(500, null, result);
    }
    return formatResponse(200, null, '开始诊断成功');
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
    const { success, result } = await firstValueFrom(
      this.diagnosisClient.send<{ success: boolean; result: any }>(
        { cmd: DIAGNOSIS_MESSAGE_PATTERNS.STATUS },
        {
          diagnosisId: id,
        },
      ),
    );
    if (!success) {
      return formatResponse(500, null, result);
    }
    return formatResponse(200, result, '获取诊断状态成功');
  }

  // 获取诊断历史记录接口
  @Get('history')
  async diagnosisHistoryGet(@Req() req: Request) {
    const { success, result } = await firstValueFrom(
      this.diagnosisClient.send<{ success: boolean; result: any }>(
        { cmd: DIAGNOSIS_MESSAGE_PATTERNS.HISTORY },
        {
          userId: req.user.userId,
        },
      ),
    );
    if (!success) {
      return formatResponse(500, null, result);
    }
    return formatResponse(200, result, '获取诊断历史记录成功');
  }

  // 获取诊断支持接口
  @Get('support')
  async diagnosisSupportGet() {
    const { success, result } = await firstValueFrom(
      this.diagnosisClient.send<{ success: boolean; result: any }>(
        { cmd: DIAGNOSIS_MESSAGE_PATTERNS.SUPPORT },
        {},
      ),
    );
    if (!success) {
      return formatResponse(500, null, result);
    }
    return formatResponse(200, result, '获取诊断支持成功');
  }

  // 获取诊断历史记录接口
  @Get('history/list')
  async diagnosisHistoryListGet(
    @Req() req: Request,
    @Query('page', ParseIntPipe) page?: number,
    @Query('pageSize', ParseIntPipe) pageSize?: number,
  ) {
    const { success, result } = await firstValueFrom(
      this.diagnosisClient.send<{ success: boolean; result: any }>(
        { cmd: DIAGNOSIS_MESSAGE_PATTERNS.HISTORY_LIST },
        {
          page,
          pageSize,
          userId: req.user.userId,
        },
      ),
    );
    if (!success) {
      return formatResponse(500, null, result);
    }
    return formatResponse(200, result, '获取诊断历史记录成功');
  }
}
