import {
  DiagnosisLog,
  LogLevel,
} from '@app/database/entities/diagnosis-log.entity';
import { RedisService } from '@app/redis';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';

interface LogEntry {
  diagnosisId: number;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

interface LogMetrics {
  processedCount: number;
  processTime: number;
  errorCount: number;
  lastProcessedAt: string;
  queueLength: number;
}

@Injectable()
export class DiagnosisLogService implements OnModuleDestroy {
  private readonly REDIS_LOG_QUEUE_KEY = 'diagnosis:log:queue';
  private readonly REDIS_METRICS_KEY = 'diagnosis:log:metrics';
  private readonly REDIS_ERROR_COUNT_KEY = 'diagnosis:log:metrics:error_count';
  private readonly REDIS_LOCK_KEY = 'diagnosis:log:lock';
  private readonly batchSize = 100;
  private readonly flushInterval = 1000;
  private readonly maxRetries = 3;
  private readonly lockTTL = 30000; // 30秒
  private flushIntervalId: NodeJS.Timeout;
  private lockRenewalId: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(DiagnosisLog)
    private readonly logRepository: Repository<DiagnosisLog>,
    private readonly redisService: RedisService,
  ) {
    this.flushIntervalId = setInterval(
      () => this.flushLogs(),
      this.flushInterval,
    );
  }

  async onModuleDestroy() {
    if (this.flushIntervalId) {
      clearInterval(this.flushIntervalId);
    }
    if (this.lockRenewalId) {
      clearInterval(this.lockRenewalId);
    }
    await this.flushLogs();
  }

  async addLog(
    diagnosisId: number,
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const logEntry: LogEntry = {
      diagnosisId,
      level,
      message,
      metadata,
      timestamp: Date.now(),
    };

    try {
      // 使用 Redis 事务确保原子性
      await this.redisService.execTransaction([
        (multi) =>
          multi.rpush(this.REDIS_LOG_QUEUE_KEY, JSON.stringify(logEntry)),
        (multi) => multi.llen(this.REDIS_LOG_QUEUE_KEY),
      ]);

      // 如果队列长度超过批处理大小，触发处理
      const queueLength = await this.redisService.llen(
        this.REDIS_LOG_QUEUE_KEY,
      );
      if (queueLength >= this.batchSize) {
        await this.flushLogs();
      }
    } catch (error) {
      console.error('添加日志到 Redis 队列失败:', error);
      await this.createLog(diagnosisId, level, message, metadata);
    }
  }

  private async flushLogs(): Promise<void> {
    let lockToken: string | null = null;
    let retryCount = 0;
    const maxLockRetries = 5;
    const lockRetryDelay = 200;

    while (retryCount < maxLockRetries) {
      try {
        lockToken = await this.redisService.acquireLock(
          this.REDIS_LOCK_KEY,
          this.lockTTL,
          {
            retryDelay: 50,
            maxRetries: 5,
            maxWaitTime: 2000,
          },
        );

        if (!lockToken) {
          retryCount++;
          await new Promise((resolve) => setTimeout(resolve, lockRetryDelay));
          continue;
        }

        // 使用 try-finally 确保锁一定会被释放
        try {
          // 处理日志的逻辑
          await this.processLogs();
        } finally {
          if (lockToken) {
            await this.redisService.releaseLock(this.REDIS_LOCK_KEY, lockToken);
          }
        }
        return;
      } catch (error) {
        console.error('处理日志失败:', error);
        retryCount++;
        if (retryCount < maxLockRetries) {
          await new Promise((resolve) => setTimeout(resolve, lockRetryDelay));
          continue;
        }
        return;
      }
    }
  }

  private async processLogs(): Promise<void> {
    const startTime = Date.now();
    let processedCount = 0;

    try {
      // 使用批量获取和并发处理
      const logs = await this.redisService.lrangeBatch<LogEntry>(
        this.REDIS_LOG_QUEUE_KEY,
        0,
        this.batchSize - 1,
        {
          batchSize: 20,
          maxConcurrent: 3,
          retryOptions: {
            retries: this.maxRetries,
            retryDelay: 100,
          },
        },
      );

      if (!Array.isArray(logs) || logs.length === 0) {
        return;
      }

      // 使用数据库事务
      await this.logRepository.manager.transaction(
        async (transactionalEntityManager) => {
          const entities = logs
            .map((log) => {
              try {
                if (!log.diagnosisId || !log.level || !log.message) {
                  console.error('日志数据不完整:', log);
                  return null;
                }

                return transactionalEntityManager.create(DiagnosisLog, {
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
            })
            .filter((entity): entity is DiagnosisLog => entity !== null);

          if (entities.length === 0) {
            return;
          }

          await this.saveWithRetry(entities, transactionalEntityManager);
          processedCount = entities.length;

          // 使用 Redis 事务删除已处理的日志
          await this.redisService.execTransaction([
            (multi) => {
              // 先删除已处理的日志
              for (let i = 0; i < processedCount; i++) {
                multi.lpop(this.REDIS_LOG_QUEUE_KEY);
              }
              // 获取剩余队列长度
              multi.llen(this.REDIS_LOG_QUEUE_KEY);
            },
          ]);
        },
      );

      // 更新指标
      const processTime = Date.now() - startTime;
      const queueLength = await this.redisService.llen(
        this.REDIS_LOG_QUEUE_KEY,
      );
      const metrics: LogMetrics = {
        processedCount,
        processTime,
        errorCount: 0,
        lastProcessedAt: new Date().toISOString(),
        queueLength,
      };

      await this.redisService.set(this.REDIS_METRICS_KEY, metrics, 3600);
    } catch (error) {
      await this.redisService.increment(this.REDIS_ERROR_COUNT_KEY);
      console.error('保存日志失败:', {
        error: error.message,
        code: error.code,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState,
        stack: error.stack,
      });

      if (error.code === 'ER_NO_DEFAULT_FOR_FIELD') {
        console.error('数据库字段缺少默认值:', error.sqlMessage);
      }
      if (error.code === 'ER_NO_REFERENCED_ROW') {
        console.error('外键约束错误: 诊断记录不存在:', error.sqlMessage);
      }
      throw error;
    }
  }

  private async saveWithRetry(
    entities: DiagnosisLog[],
    transactionalEntityManager: any,
    maxRetries = 3,
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        await transactionalEntityManager.save(entities);
        return;
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, i) * 1000),
          );
        }
      }
    }

    throw new Error(`保存日志失败: ${lastError?.message}`);
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

  async getMetrics(): Promise<LogMetrics | null> {
    return this.redisService.get<LogMetrics>(this.REDIS_METRICS_KEY);
  }

  @Cron('0 0 * * *')
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
