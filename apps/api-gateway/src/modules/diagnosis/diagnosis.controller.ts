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
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { MIME_TYPE } from '@shared/enum/mime.enum';
import { Request } from 'express';
import { FileSizeValidationPipe } from '../file/pipe/file-size.pipe';
import { FileTypeValidationPipe } from '../file/pipe/file-type.pipe';
import { DiagnosisService } from './diagnosis.service';
import { ParseNumberArrayPipe } from '@common/pipe/array-number.pipe';

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
    // 从请求头获取 token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('未提供认证令牌');
    }

    return this.diagnosisService.startDiagnosis(
      req.user.userId,
      diagnosisId,
      dto,
      token,
    );
  }

  @Post(':id/start/async')
  async startDiagnosisAsync(
    @Req() req: Request,
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    diagnosisId: number,
    @Body() dto: StartDiagnosisDto,
  ) {
    // 从请求头获取 token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('未提供认证令牌');
    }

    return this.diagnosisService.startDiagnosisAsync(
      req.user.userId,
      diagnosisId,
      dto,
      token,
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

  @Delete('history')
  @HttpCode(HttpStatus.NO_CONTENT)
  async diagnosisHistoriesDelete(
    @Req() req: Request,
    @Query('diagnosisIds', ParseNumberArrayPipe) diagnosisIds: number[],
  ) {
    return this.diagnosisService.diagnosisHistoriesDelete(
      req.user.userId,
      diagnosisIds,
    );
  }

  @Delete('history/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async diagnosisHistoryDelete(
    @Req() req: Request,
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.diagnosisService.diagnosisHistoryDelete(id, req.user.userId);
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
