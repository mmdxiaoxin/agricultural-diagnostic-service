import { Controller, Get } from '@nestjs/common';
import { UploadServiceService } from './upload-service.service';

@Controller()
export class UploadServiceController {
  constructor(private readonly uploadServiceService: UploadServiceService) {}

  @Get()
  getHello(): string {
    return this.uploadServiceService.getHello();
  }
}
