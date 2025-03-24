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
import { AuthGuard } from '@common/guards/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { DiagnosisService } from './diagnosis.service';
import { FileSizeValidationPipe } from '../file/pipe/file-size.pipe';
import { FileTypeValidationPipe } from '../file/pipe/file-type.pipe';
import { MIME_TYPE } from '@shared/enum/mime.enum';

@ApiTags('病害诊断模块')
@Controller('diagnosis')
@UseGuards(AuthGuard)
export class DiagnosisController {
  constructor(private readonly diagnosisService: DiagnosisService) {}

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
    return this.diagnosisService.uploadData(req, file);
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
    return this.diagnosisService.startDiagnosis(req.user.userId, id);
  }

  @Get(':id/status')
  async getDiagnosisStatus(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.diagnosisService.getDiagnosisStatus(id);
  }

  @Get('history')
  async diagnosisHistoryGet(@Req() req: Request) {
    return this.diagnosisService.diagnosisHistoryGet(req.user.userId);
  }

  @Get('support')
  async diagnosisSupportGet() {
    return this.diagnosisService.diagnosisSupportGet();
  }

  @Get('history/list')
  async diagnosisHistoryListGet(
    @Req() req: Request,
    @Query('page', ParseIntPipe) page?: number,
    @Query('pageSize', ParseIntPipe) pageSize?: number,
  ) {
    return this.diagnosisService.diagnosisHistoryListGet(
      req.user.userId,
      page,
      pageSize,
    );
  }
}
