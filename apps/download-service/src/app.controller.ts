import { File as FileEntity } from '@app/database/entities';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { createReadStream, existsSync } from 'fs';

@Controller()
export class DownloadController {
  private readonly logger = new Logger(DownloadController.name);

  @MessagePattern({ cmd: 'file.download' })
  async downloadFile(@Payload() payload: { fileMeta: FileEntity }) {
    try {
      const filePath = payload.fileMeta.filePath;
      if (!filePath || !existsSync(filePath)) {
        return { success: false, message: '文件不存在' };
      }
      const fileStream = createReadStream(filePath);
      let fileData = Buffer.alloc(0);
      for await (const chunk of fileStream) {
        fileData = Buffer.concat([fileData, chunk]);
      }
      return { success: true, data: fileData.toString('base64') };
    } catch (err) {
      this.logger.error(`下载失败: ${err.message}`);
      return { success: false, message: '文件下载失败' };
    }
  }
}
