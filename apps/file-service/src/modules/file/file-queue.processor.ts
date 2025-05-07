import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { FileOperationService } from '@app/file-operation/file-operation.service';
import { FileEntity } from '@app/database/entities';
import { DataSource } from 'typeorm';
import { Not } from 'typeorm';

@Processor('file-delete-queue')
export class FileDeleteQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(FileDeleteQueueProcessor.name);

  constructor(
    private readonly fileOperationService: FileOperationService,
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async process(job: Job<{ fileId: number; userId: number }>) {
    const { fileId, userId } = job.data;
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // 获取文件信息
      const file = await queryRunner.manager.findOne(FileEntity, {
        where: { id: fileId },
        select: ['id', 'fileMd5', 'filePath', 'createdBy', 'version'],
      });

      if (!file) {
        this.logger.warn(`File with ID ${fileId} not found`);
        return;
      }

      if (file.createdBy !== userId) {
        this.logger.warn(
          `User ${userId} is not authorized to delete file ${fileId}`,
        );
        return;
      }

      // 获取该文件的所有引用（排除当前文件）
      const references = await queryRunner.manager.find(FileEntity, {
        where: {
          fileMd5: file.fileMd5,
          id: Not(fileId),
        },
        select: ['id'],
      });

      // 如果没有其他引用，则删除实际文件
      if (references.length === 0) {
        try {
          await this.fileOperationService.deleteFile(file.filePath);
          this.logger.log(
            `Successfully deleted physical file: ${file.filePath}`,
          );
        } catch (error) {
          this.logger.error(`Failed to delete physical file: ${error.message}`);
          throw error; // 抛出错误以触发重试
        }
      }

      // 使用乐观锁删除文件元数据
      const deleteResult = await queryRunner.manager.delete(FileEntity, {
        id: fileId,
        version: file.version,
      });

      if (deleteResult.affected === 0) {
        this.logger.warn(`File ${fileId} was modified by another operation`);
        return;
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Successfully deleted file metadata for file ${fileId}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error processing file delete job: ${error.message}`);
      throw error; // 抛出错误以触发重试
    } finally {
      await queryRunner.release();
    }
  }
}
