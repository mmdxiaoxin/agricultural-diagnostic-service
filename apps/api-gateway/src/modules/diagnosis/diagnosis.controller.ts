import { StartDiagnosisDto } from '@common/dto/diagnosis/start-diagnosis.dto';
import { AuthGuard } from '@common/guards/auth.guard';
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
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { MIME_TYPE } from '@shared/enum/mime.enum';
import { Request } from 'express';
import { FileSizeValidationPipe } from '../file/pipe/file-size.pipe';
import { FileTypeValidationPipe } from '../file/pipe/file-type.pipe';
import { DiagnosisService } from './diagnosis.service';

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
    diagnosisId: number,
    @Body() dto: StartDiagnosisDto,
  ) {
    return this.diagnosisService.startDiagnosis(
      req.user.userId,
      diagnosisId,
      dto,
    );
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

  @Get('support')
  async diagnosisSupportGet() {
    return this.diagnosisService.diagnosisSupportGet();
  }

  @Get('history')
  async diagnosisHistoryGet(@Req() req: Request) {
    return this.diagnosisService.diagnosisHistoryGet(req.user.userId);
  }

  @Delete('history/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async diagnosisHistoryDelete(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.diagnosisService.diagnosisHistoryDelete(id);
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
