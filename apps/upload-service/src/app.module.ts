import { Module } from '@nestjs/common';
import { UploadController } from './app.controller';
import { UploadService } from './app.service';

@Module({
  imports: [],
  controllers: [UploadController],
  providers: [UploadService],
})
export class AppModule {}
