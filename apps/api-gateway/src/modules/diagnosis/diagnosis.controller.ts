import { Roles } from '@common/decorator/roles.decorator';
import { CreateFeedbackDto } from '@common/dto/diagnosis/create-feedback.dto';
import { DiagnosisSupportDto } from '@common/dto/diagnosis/diagnosis-support.dto';
import { FeedbackQueryDto } from '@common/dto/diagnosis/feedback-query.dto';
import { StartDiagnosisDto } from '@common/dto/diagnosis/start-diagnosis.dto';
import { UpdateFeedbackDto } from '@common/dto/diagnosis/update-feedback.dto';
import { PageQueryDto } from '@common/dto/page-query.dto';
import { AuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { ParseNumberArrayPipe } from '@common/pipe/array-number.pipe';
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
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { MIME_TYPE } from '@shared/enum/mime.enum';
import { Role } from '@shared/enum/role.enum';
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
    @Req() req: Request,
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.diagnosisService.getDiagnosisStatus(req.user.userId, id);
  }

  @Get(':id/log')
  async getDiagnosisLog(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.diagnosisService.getDiagnosisLog(id);
  }

  @Get(':id/log/list')
  async getDiagnosisLogList(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Query() query: PageQueryDto,
  ) {
    return this.diagnosisService.getDiagnosisLogList(id, query);
  }

  @Get('statistics')
  async diagnosisStatisticsGet(@Req() req: Request) {
    return this.diagnosisService.diagnosisStatisticsGet(req.user.userId);
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

  @Post('history/:id/feedback')
  async diagnosisHistoryFeedbackCreate(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.diagnosisService.diagnosisHistoryFeedbackCreate(
      req.user.userId,
      id,
      dto,
    );
  }

  @Get('history/list')
  async diagnosisHistoryListGet(
    @Req() req: Request,
    @Query() query: PageQueryDto,
  ) {
    return this.diagnosisService.diagnosisHistoryListGet(
      req.user.userId,
      query,
    );
  }

  @Get('feedback/list')
  async diagnosisHistoryFeedbackListGet(
    @Req() req: Request,
    @Query() query: FeedbackQueryDto,
  ) {
    return this.diagnosisService.diagnosisHistoryFeedbackListGet(
      req.user.userId,
      query,
    );
  }

  @Get('feedback/list/all')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Expert)
  async diagnosisHistoryFeedbackListAllGet(@Query() query: FeedbackQueryDto) {
    return this.diagnosisService.diagnosisHistoryFeedbackListAllGet(query);
  }

  @Get('feedback/:feedbackId')
  async diagnosisHistoryFeedbackDetailGet(
    @Req() req: Request,
    @Param('feedbackId', ParseIntPipe) feedbackId: number,
  ) {
    return this.diagnosisService.diagnosisHistoryFeedbackDetailGet(
      req.user.userId,
      feedbackId,
    );
  }

  @Put('feedback/:feedbackId')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Expert)
  async diagnosisHistoryFeedbackUpdate(
    @Req() req: Request,
    @Param('feedbackId', ParseIntPipe) feedbackId: number,
    @Body() dto: UpdateFeedbackDto,
  ) {
    return this.diagnosisService.diagnosisHistoryFeedbackUpdate(
      req.user.userId,
      feedbackId,
      dto,
    );
  }

  @Delete('feedback/:feedbackId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async diagnosisHistoryFeedbackDelete(
    @Req() req: Request,
    @Param('feedbackId', ParseIntPipe) feedbackId: number,
  ) {
    return this.diagnosisService.diagnosisHistoryFeedbackDelete(
      req.user.userId,
      feedbackId,
    );
  }

  @Delete('feedback')
  @HttpCode(HttpStatus.NO_CONTENT)
  async diagnosisHistoryFeedbackDeleteBatch(
    @Req() req: Request,
    @Query('feedbackIds', ParseNumberArrayPipe) feedbackIds: number[],
  ) {
    return this.diagnosisService.diagnosisHistoryFeedbackDeleteBatch(
      req.user.userId,
      feedbackIds,
    );
  }

  @Post('support')
  async createDiagnosisSupport(@Body() data: DiagnosisSupportDto) {
    return this.diagnosisService.createDiagnosisSupport(data);
  }

  @Get('support')
  async getDiagnosisSupportList() {
    return this.diagnosisService.getDiagnosisSupportList();
  }

  @Get('support/:id')
  async getDiagnosisSupport(@Param('id', ParseIntPipe) id: number) {
    return this.diagnosisService.getDiagnosisSupport(id);
  }

  @Put('support/:id')
  async updateDiagnosisSupport(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: DiagnosisSupportDto,
  ) {
    return this.diagnosisService.updateDiagnosisSupport(id, data);
  }

  @Delete('support/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDiagnosisSupport(@Param('id', ParseIntPipe) id: number) {
    return this.diagnosisService.deleteDiagnosisSupport(id);
  }
}
