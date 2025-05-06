import { FileOperationService } from '@app/file-operation/file-operation.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { FILE_DELETE_QUEUE } from './index';

@Processor(FILE_DELETE_QUEUE)
export class FileQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(FileQueueProcessor.name);

  constructor(private readonly fileOperationService: FileOperationService) {
    super();
  }

  async process(job: Job<{ filePath: string }>): Promise<void> {
    const { filePath } = job.data;
    this.logger.log(`开始处理文件删除任务: ${filePath}`);

    try {
      await this.fileOperationService.deleteFile(filePath);
      this.logger.log(`文件删除任务完成: ${filePath}`);
    } catch (error) {
      this.logger.error(`文件删除任务失败: ${filePath}`, error);
      throw error;
    }
  }
}
