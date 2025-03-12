import { Module } from '@nestjs/common';
import { DownloadServiceController } from './download-service.controller';
import { DownloadServiceService } from './download-service.service';

@Module({
  imports: [],
  controllers: [DownloadServiceController],
  providers: [DownloadServiceService],
})
export class DownloadServiceModule {}
