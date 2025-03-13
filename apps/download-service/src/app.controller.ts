import { Controller } from '@nestjs/common';
import { GrpcMethod, MessagePattern, Payload } from '@nestjs/microservices';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';

@Controller()
export class DownloadController {
  @GrpcMethod('DownloadService', 'DownloadFile')
  async *downloadFile(data: { filename: string }) {
    const filePath = join(__dirname, '..', 'files', data.filename);
    const fileStream = createReadStream(filePath);

    for await (const chunk of fileStream) {
      yield { data: chunk };
    }
  }
}
