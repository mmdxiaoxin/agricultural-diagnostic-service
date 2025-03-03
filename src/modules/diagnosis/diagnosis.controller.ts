import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';

import { Request } from 'express';
import { DiagnosisService } from './services/diagnosis.service';
@Controller('diagnosis')
export class DiagnosisController {
  constructor(private readonly diagnosisService: DiagnosisService) {}

  // 上传待诊断数据接口
  @Post('upload')
  async uploadData(@Req() req: Request, @Body() dto: any) {
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
