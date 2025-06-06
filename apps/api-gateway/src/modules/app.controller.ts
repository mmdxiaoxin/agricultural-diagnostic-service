import { AuthGuard } from '@common/guards/auth.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  @UseGuards(AuthGuard)
  @Get('speed-test')
  async getTimestamp(): Promise<{
    code: number;
    message: string;
    timestamp: number;
  }> {
    const timestamp = Date.now();
    // 返回响应给前端，包含一个时间戳，前端可以根据时间戳计算响应延时
    return {
      code: 200,
      message: 'Speed test successful',
      timestamp,
    };
  }
}
