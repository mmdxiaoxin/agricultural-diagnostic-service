import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { FileOperationService } from '@app/file-operation/file-operation.service';
import { FileEntity } from '@app/database/entities';
import { DataSource } from 'typeorm';
import { Not } from 'typeorm';

export const FILE_DELETE_QUEUE = 'file-delete-queue';

@Processor(FILE_DELETE_QUEUE)
export class FileDeleteQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(FileDeleteQueueProcessor.name);

  constructor(
    private readonly fileOperationService: FileOperationService,
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async process(
    job: Job<{ fileId: number; filePath: string; fileMd5: string }>,
  ) {
    const { fileId, filePath, fileMd5 } = job.data;
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // 获取该文件的所有引用（排除当前文件）
      const references = await queryRunner.manager.find(FileEntity, {
        where: {
          fileMd5: fileMd5,
          id: Not(fileId),
        },
        select: ['id'],
      });

      // 如果没有其他引用，则删除实际文件
      if (references.length === 0) {
        try {
          await this.fileOperationService.deleteFile(filePath);
          this.logger.log(`Successfully deleted physical file: ${filePath}`);
        } catch (error) {
          this.logger.error(`Failed to delete physical file: ${error.message}`);
          throw error; // 抛出错误以触发重试
        }
      } else {
        this.logger.log(
          `File ${fileId} has other references, skipping physical deletion`,
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error processing file delete job: ${error.message}`);
      throw error; // 抛出错误以触发重试
    } finally {
      await queryRunner.release();
    }
  }
}
