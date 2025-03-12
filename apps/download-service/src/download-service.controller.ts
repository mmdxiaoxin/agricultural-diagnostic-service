import { Controller, Get } from '@nestjs/common';
import { DownloadServiceService } from './download-service.service';

@Controller()
export class DownloadServiceController {
  constructor(private readonly downloadServiceService: DownloadServiceService) {}

  @Get()
  getHello(): string {
    return this.downloadServiceService.getHello();
  }
}
