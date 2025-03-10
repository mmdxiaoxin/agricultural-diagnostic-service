import { Controller, Get } from '@nestjs/common';
import { FileServiceService } from './file-service.service';

@Controller()
export class FileServiceController {
  constructor(private readonly fileServiceService: FileServiceService) {}

  @Get()
  getHello(): string {
    return this.fileServiceService.getHello();
  }
}
