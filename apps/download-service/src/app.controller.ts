import { File as FileEntity } from '@app/database/entities';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DownloadService } from './app.service';

@Controller()
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @MessagePattern({ cmd: 'file.download' })
  async downloadFile(@Payload() payload: { fileMeta: FileEntity }) {
    return this.downloadService.downloadFile(payload);
  }

  @MessagePattern({ cmd: 'files.download' })
  async downloadFiles(@Payload() payload: { filesMeta: FileEntity[] }) {
    return this.downloadService.downloadFilesAsZip(payload);
  }
}
