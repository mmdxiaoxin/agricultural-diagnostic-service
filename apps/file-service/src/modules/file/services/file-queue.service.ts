import { FileOperationService } from '@app/file-operation/file-operation.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { FILE_DELETE_QUEUE } from '../processors';

@Injectable()
export class FileQueueService {
  private readonly logger = new Logger(FileQueueService.name);

  constructor(
    @InjectQueue(FILE_DELETE_QUEUE) private fileDeleteQueue: Queue,
    private readonly fileOperationService: FileOperationService,
  ) {}

  /**
   * 添加文件删除任务到队列
   * @param filePath 文件路径
   * @param jobId 任务ID
   */
  async addDeleteJob(filePath: string, jobId: string) {
    try {
      await this.fileDeleteQueue.add(
        'delete-file',
        { filePath },
        {
          jobId,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
      this.logger.log(`文件删除任务已添加到队列: ${filePath}`);
    } catch (error) {
      this.logger.error(`添加文件删除任务失败: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 批量添加文件删除任务到队列
   * @param filePaths 文件路径数组
   * @param jobIds 任务ID数组
   */
  async addBatchDeleteJobs(filePaths: string[], jobIds: string[]) {
    try {
      const jobs = filePaths.map((filePath, index) => ({
        name: 'delete-file',
        data: { filePath },
        opts: {
          jobId: jobIds[index],
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }));

      await this.fileDeleteQueue.addBulk(jobs);
      this.logger.log(
        `批量文件删除任务已添加到队列: ${filePaths.length}个文件`,
      );
    } catch (error) {
      this.logger.error('批量添加文件删除任务失败', error);
      throw error;
    }
  }
}
