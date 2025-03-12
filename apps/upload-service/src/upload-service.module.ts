import { Module } from '@nestjs/common';
import { UploadServiceController } from './upload-service.controller';
import { UploadServiceService } from './upload-service.service';

@Module({
  imports: [],
  controllers: [UploadServiceController],
  providers: [UploadServiceService],
})
export class UploadServiceModule {}
