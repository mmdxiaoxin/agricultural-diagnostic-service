import {
  ApiErrorResponse,
  ApiNullResponse,
  ApiResponse,
} from '@common/decorator/api-response.decorator';
import { Roles } from '@common/decorator/roles.decorator';
import { CreateFeedbackDto } from '@common/dto/diagnosis/create-feedback.dto';
import { DiagnosisHistoryDto } from '@common/dto/diagnosis/diagnosis-history.dto';
import { DiagnosisSupportResponseDto } from '@common/dto/diagnosis/diagnosis-support-response.dto';
import { DiagnosisSupportDto } from '@common/dto/diagnosis/diagnosis-support.dto';
import { FeedbackQueryDto } from '@common/dto/diagnosis/feedback-query.dto';
import { StartDiagnosisDto } from '@common/dto/diagnosis/start-diagnosis.dto';
import { UpdateFeedbackDto } from '@common/dto/diagnosis/update-feedback.dto';
import { PageQueryDto } from '@common/dto/page-query.dto';
import { createPageResponseDto } from '@common/dto/page-response.dto';
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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MIME_TYPE } from '@shared/enum/mime.enum';
import { Role } from '@shared/enum/role.enum';
import { Request } from 'express';
import { FileSizeValidationPipe } from '../file/pipe/file-size.pipe';
import { FileTypeValidationPipe } from '../file/pipe/file-type.pipe';
import { DiagnosisService } from './diagnosis.service';

@ApiTags('病害诊断模块')
@Controller('diagnosis')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class DiagnosisController {
  constructor(private readonly diagnosisService: DiagnosisService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: '上传诊断图片',
    description: '上传需要进行病害诊断的图片',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '图片文件（支持PNG、JPEG格式，最大5MB）',
        },
      },
    },
  })
  @ApiResponse(HttpStatus.CREATED, '上传成功', DiagnosisHistoryDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '文件格式或大小不符合要求')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
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
  @ApiOperation({
    summary: '开始诊断',
    description: '开始对指定图片进行病害诊断',
  })
  @ApiParam({ name: 'id', description: '诊断记录ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '诊断开始')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '诊断记录不存在')
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
  @ApiOperation({
    summary: '异步开始诊断',
    description: '异步开始对指定图片进行病害诊断',
  })
  @ApiParam({ name: 'id', description: '诊断记录ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '诊断任务已提交')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '诊断记录不存在')
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
  @ApiOperation({
    summary: '获取诊断状态',
    description: '获取指定诊断记录的当前状态',
  })
  @ApiParam({ name: 'id', description: '诊断记录ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '获取成功', DiagnosisHistoryDto)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '诊断记录不存在')
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
  @ApiOperation({
    summary: '获取诊断日志',
    description: '获取指定诊断记录的详细日志',
  })
  @ApiParam({ name: 'id', description: '诊断记录ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '获取成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '诊断记录不存在')
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
  @ApiOperation({
    summary: '获取诊断日志列表',
    description: '获取指定诊断记录的日志列表',
  })
  @ApiParam({ name: 'id', description: '诊断记录ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '获取成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '诊断记录不存在')
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
  @ApiOperation({
    summary: '获取诊断统计',
    description: '获取当前用户的诊断统计数据',
  })
  @ApiResponse(HttpStatus.OK, '获取成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  async diagnosisStatisticsGet(@Req() req: Request) {
    return this.diagnosisService.diagnosisStatisticsGet(req.user.userId);
  }

  @Get('history')
  @ApiOperation({
    summary: '获取诊断历史',
    description: '获取当前用户的诊断历史记录',
  })
  @ApiResponse(HttpStatus.OK, '获取成功', DiagnosisHistoryDto, true)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  async diagnosisHistoryGet(@Req() req: Request) {
    return this.diagnosisService.diagnosisHistoryGet(req.user.userId);
  }

  @Delete('history')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '批量删除诊断历史',
    description: '批量删除指定的诊断历史记录',
  })
  @ApiNullResponse(HttpStatus.NO_CONTENT, '删除成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
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
  @ApiOperation({
    summary: '删除诊断历史',
    description: '删除指定的诊断历史记录',
  })
  @ApiParam({ name: 'id', description: '诊断历史记录ID', type: 'number' })
  @ApiNullResponse(HttpStatus.NO_CONTENT, '删除成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '诊断历史记录不存在')
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
  @ApiOperation({
    summary: '创建诊断反馈',
    description: '为指定的诊断记录创建反馈',
  })
  @ApiParam({ name: 'id', description: '诊断历史记录ID', type: 'number' })
  @ApiResponse(HttpStatus.CREATED, '创建成功', CreateFeedbackDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '诊断历史记录不存在')
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
  @ApiOperation({
    summary: '获取诊断历史列表',
    description: '获取当前用户的诊断历史记录列表',
  })
  @ApiResponse(
    HttpStatus.OK,
    '获取成功',
    createPageResponseDto(DiagnosisHistoryDto),
  )
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
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
  @ApiOperation({
    summary: '获取反馈列表',
    description: '获取当前用户的诊断反馈列表',
  })
  @ApiResponse(HttpStatus.OK, '获取成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
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
  @ApiOperation({
    summary: '获取所有反馈列表',
    description: '获取所有用户的诊断反馈列表（仅管理员和专家可访问）',
  })
  @ApiResponse(HttpStatus.OK, '获取成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  async diagnosisHistoryFeedbackListAllGet(@Query() query: FeedbackQueryDto) {
    return this.diagnosisService.diagnosisHistoryFeedbackListAllGet(query);
  }

  @Get('feedback/:feedbackId')
  @ApiOperation({
    summary: '获取反馈详情',
    description: '获取指定诊断反馈的详细信息',
  })
  @ApiParam({ name: 'feedbackId', description: '反馈ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '获取成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '反馈不存在')
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
  @ApiOperation({
    summary: '更新反馈',
    description: '更新指定的诊断反馈（仅管理员和专家可操作）',
  })
  @ApiParam({ name: 'feedbackId', description: '反馈ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '更新成功', UpdateFeedbackDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '反馈不存在')
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
  @ApiOperation({ summary: '删除反馈', description: '删除指定的诊断反馈' })
  @ApiParam({ name: 'feedbackId', description: '反馈ID', type: 'number' })
  @ApiNullResponse(HttpStatus.NO_CONTENT, '删除成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '反馈不存在')
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
  @ApiOperation({
    summary: '批量删除反馈',
    description: '批量删除指定的诊断反馈',
  })
  @ApiNullResponse(HttpStatus.NO_CONTENT, '删除成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
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
  @ApiOperation({
    summary: '创建诊断支持',
    description: '创建新的诊断支持信息',
  })
  @ApiResponse(HttpStatus.CREATED, '创建成功', DiagnosisSupportDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  async createDiagnosisSupport(@Body() data: DiagnosisSupportDto) {
    return this.diagnosisService.createDiagnosisSupport(data);
  }

  @Get('support')
  @ApiOperation({
    summary: '获取诊断支持列表',
    description: '获取所有诊断支持信息列表',
  })
  @ApiResponse(HttpStatus.OK, '获取成功', DiagnosisSupportResponseDto, true)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  async getDiagnosisSupportList() {
    return this.diagnosisService.getDiagnosisSupportList();
  }

  @Get('support/:id')
  @ApiOperation({
    summary: '获取诊断支持详情',
    description: '获取指定诊断支持的详细信息',
  })
  @ApiParam({ name: 'id', description: '诊断支持ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '获取成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '诊断支持不存在')
  async getDiagnosisSupport(@Param('id', ParseIntPipe) id: number) {
    return this.diagnosisService.getDiagnosisSupport(id);
  }

  @Put('support/:id')
  @ApiOperation({
    summary: '更新诊断支持',
    description: '更新指定的诊断支持信息',
  })
  @ApiParam({ name: 'id', description: '诊断支持ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '更新成功', DiagnosisSupportDto)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '诊断支持不存在')
  async updateDiagnosisSupport(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: DiagnosisSupportDto,
  ) {
    return this.diagnosisService.updateDiagnosisSupport(id, data);
  }

  @Delete('support/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '删除诊断支持',
    description: '删除指定的诊断支持信息',
  })
  @ApiParam({ name: 'id', description: '诊断支持ID', type: 'number' })
  @ApiNullResponse(HttpStatus.NO_CONTENT, '删除成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '诊断支持不存在')
  async deleteDiagnosisSupport(@Param('id', ParseIntPipe) id: number) {
    return this.diagnosisService.deleteDiagnosisSupport(id);
  }
}
