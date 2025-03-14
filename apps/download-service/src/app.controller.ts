import { File as FileEntity } from '@app/database/entities';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DOWNLOAD_MESSAGE_PATTERNS } from '@shared/constants/download-message-patterns';
import { DownloadService } from './app.service';

@Controller()
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @MessagePattern({ cmd: DOWNLOAD_MESSAGE_PATTERNS.FILE_DOWNLOAD })
  async downloadFile(@Payload() payload: { fileMeta: FileEntity }) {
    return this.downloadService.downloadFile(payload);
  }

  @MessagePattern({ cmd: DOWNLOAD_MESSAGE_PATTERNS.FILES_DOWNLOAD })
  async downloadFiles(@Payload() payload: { filesMeta: FileEntity[] }) {
    return this.downloadService.downloadFilesAsZip(payload);
  }
}
