import {
  DiagnosisLog,
  LogLevel,
} from '@app/database/entities/diagnosis-log.entity';
import { RedisService } from '@app/redis';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository, EntityManager, DataSource } from 'typeorm';

@Injectable()
export class DiagnosisLogService implements OnModuleDestroy {
  private readonly REDIS_LOG_QUEUE_KEY = 'diagnosis:log:queue';
  private readonly REDIS_METRICS_KEY = 'diagnosis:log:metrics';
  private readonly REDIS_ERROR_COUNT_KEY = 'diagnosis:log:metrics:error_count';
  private readonly batchSize = 10;
  private readonly flushInterval = 1000;
  private isProcessing = false;
  private flushIntervalId: NodeJS.Timeout;

  constructor(
    @InjectRepository(DiagnosisLog)
    private readonly logRepository: Repository<DiagnosisLog>,
    private readonly redisService: RedisService,
    private readonly dataSource: DataSource,
  ) {
    // 启动定时刷新
    this.flushIntervalId = setInterval(
      () => this.flushLogs(),
      this.flushInterval,
    );
  }

  async onModuleDestroy() {
    if (this.flushIntervalId) {
      clearInterval(this.flushIntervalId);
    }
    // 确保所有日志都被处理
    await this.flushLogs();
  }

  // 异步添加日志
  async addLog(
    diagnosisId: number,
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const logEntry = {
      diagnosisId,
      level,
      message,
      metadata,
      timestamp: Date.now(),
    };

    try {
      await this.redisService.rpush(this.REDIS_LOG_QUEUE_KEY, logEntry);

      // 如果队列长度达到批处理大小，立即处理
      const queueLength = await this.redisService.llen(
        this.REDIS_LOG_QUEUE_KEY,
      );
      if (queueLength >= this.batchSize) {
        await this.flushLogs();
      }
    } catch (error) {
      console.error('添加日志到 Redis 队列失败:', error);
      // 如果 Redis 操作失败，直接写入数据库
      await this.createLog(diagnosisId, level, message, metadata);
    }
  }

  // 刷新日志到数据库
  private async flushLogs(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction('READ COMMITTED');

      const logs = await this.redisService.lrange(
        this.REDIS_LOG_QUEUE_KEY,
        0,
        this.batchSize - 1,
      );

      if (!Array.isArray(logs) || logs.length === 0) {
        return;
      }

      // 分批处理，避免单次事务过大
      const batchSize = 5;
      for (let i = 0; i < logs.length; i += batchSize) {
        const batch = logs.slice(i, i + batchSize);
        const entities = batch
          .map((log) => this.createLogEntity(log))
          .filter((entity): entity is DiagnosisLog => entity !== null);

        if (entities.length > 0) {
          await this.saveWithRetry(entities, queryRunner.manager);
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
      this.isProcessing = false;
    }
  }

  private createLogEntity(log: any): DiagnosisLog | null {
    try {
      if (!log.diagnosisId || !log.level || !log.message) {
        console.error('日志数据不完整:', log);
        return null;
      }

      return this.logRepository.create({
        diagnosisId: log.diagnosisId,
        level: log.level,
        message: log.message,
        metadata: log.metadata || {},
        createdAt: new Date(log.timestamp || Date.now()),
      });
    } catch (error) {
      console.error('解析日志数据失败:', error, '原始数据:', log);
      return null;
    }
  }

  private async saveWithRetry(
    entities: DiagnosisLog[],
    transactionalEntityManager: EntityManager,
    maxRetries = 3,
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        // 添加随机延迟，避免多个重试同时发生
        if (i > 0) {
          const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        await transactionalEntityManager.save(entities);
        return;
      } catch (error) {
        lastError = error;
        // 只对特定错误进行重试
        if (!this.isRetryableError(error)) {
          throw error;
        }
      }
    }

    throw new Error(`保存日志失败: ${lastError?.message}`);
  }

  private isRetryableError(error: any): boolean {
    return (
      error.message?.includes('Lock wait timeout exceeded') ||
      error.message?.includes('Deadlock found') ||
      error.code === 'ER_LOCK_WAIT_TIMEOUT' ||
      error.code === 'ER_LOCK_DEADLOCK'
    );
  }

  async createLog(
    diagnosisId: number,
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<DiagnosisLog> {
    const log = this.logRepository.create({
      diagnosisId,
      level,
      message,
      metadata,
    });
    return this.logRepository.save(log);
  }

  async createLogs(
    logs: Array<{
      diagnosisId: number;
      level: LogLevel;
      message: string;
      metadata?: Record<string, any>;
    }>,
  ): Promise<DiagnosisLog[]> {
    const entities = logs.map((log) => this.logRepository.create(log));
    return this.logRepository.save(entities);
  }

  async getDiagnosisLogs(diagnosisId: number): Promise<DiagnosisLog[]> {
    return this.logRepository.find({
      where: { diagnosisId },
      order: { createdAt: 'ASC' },
    });
  }

  async getDiagnosisLogsByTimeRange(
    diagnosisId: number,
    startTime: Date,
    endTime: Date,
  ): Promise<DiagnosisLog[]> {
    return this.logRepository.find({
      where: {
        diagnosisId,
        createdAt: Between(startTime, endTime),
      },
      order: { createdAt: 'ASC' },
    });
  }

  // 定期清理过期日志
  @Cron('0 0 * * *') // 每天凌晨执行
  async cleanupOldLogs() {
    const retentionDays = 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      await this.logRepository.delete({
        createdAt: Between(new Date(0), cutoffDate),
      });
    } catch (error) {
      console.error('清理过期日志失败:', error);
    }
  }
}
