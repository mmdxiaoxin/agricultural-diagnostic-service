import { AuthGuard } from '@common/guards/auth.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(AuthGuard)
  @Get('speed-test')
  async getTimestamp(): Promise<{ message: string; timestamp: number }> {
    const timestamp = Date.now();
    // 返回响应给前端，包含一个时间戳，前端可以根据时间戳计算响应延时
    return {
      message: 'Speed test successful',
      timestamp,
    };
  }
}
