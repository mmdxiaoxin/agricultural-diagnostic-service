import { DatabaseModule } from '@app/database';
import { File, Task } from '@app/database/entities';
import { Module } from '@nestjs/common';
import { UploadController } from './app.controller';
import { UploadService } from './app.service';

@Module({
  imports: [DatabaseModule.register([File, Task])],
  controllers: [UploadController],
  providers: [UploadService],
})
export class AppModule {}
