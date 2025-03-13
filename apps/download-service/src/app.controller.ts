import { Controller, HttpStatus, Inject, Logger } from '@nestjs/common';
import { ClientProxy, GrpcMethod, RpcException } from '@nestjs/microservices';
import { FILE_SERVICE_NAME } from 'config/microservice.config';
import { createReadStream, existsSync } from 'fs';
import { lastValueFrom } from 'rxjs';

@Controller()
export class DownloadController {
  private readonly logger = new Logger(DownloadController.name);

  constructor(
    @Inject(FILE_SERVICE_NAME)
    private readonly fileClient: ClientProxy,
  ) {}

  @GrpcMethod('DownloadService', 'DownloadFile')
  async *downloadFile(data: { fileId: number }) {
    this.logger.log(`开始下载文件：${data.fileId}`);
    const rpcResponse = await lastValueFrom(
      this.fileClient.send('file.get', { fileId: data.fileId }),
    );
    if (!rpcResponse.file || !rpcResponse.success) {
      throw new RpcException({
        code: HttpStatus.NOT_FOUND,
        message: '无文件数据',
      });
    }
    if (rpcResponse.file.filePath && existsSync(rpcResponse.file.filePath)) {
      this.logger.log(`开始下载文件：${rpcResponse.file.filePath}`);
      const fileStream = createReadStream(rpcResponse.file.filePath);
      // 遍历文件流中的每个 chunk，如果 chunk 有效则 yield，否则跳过
      for await (const chunk of fileStream) {
        if (chunk !== undefined && chunk !== null) {
          yield { data: chunk };
        }
      }
    } else {
      throw new RpcException({
        code: HttpStatus.NOT_FOUND,
        message: '文件不存在',
      });
    }
  }
}
