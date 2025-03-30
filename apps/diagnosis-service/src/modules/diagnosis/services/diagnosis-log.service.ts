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
  pendingCount: number;
}

@Injectable()
export class DiagnosisLogService implements OnModuleDestroy {
  private readonly STREAM_KEY = 'diagnosis:log:stream';
  private readonly CONSUMER_GROUP = 'diagnosis:log:group';
  private readonly CONSUMER_NAME = 'diagnosis:log:consumer';
  private readonly REDIS_METRICS_KEY = 'diagnosis:log:metrics';
  private readonly REDIS_ERROR_COUNT_KEY = 'diagnosis:log:metrics:error_count';
  private readonly batchSize = 100;
  private readonly flushInterval = 1000;
  private flushIntervalId: NodeJS.Timeout;
  private isInitialized = false;

  constructor(
    @InjectRepository(DiagnosisLog)
    private readonly logRepository: Repository<DiagnosisLog>,
    private readonly redisService: RedisService,
  ) {
    this.initializeStream().catch((error) => {
      console.error('初始化 Stream 失败:', error);
    });
    this.flushIntervalId = setInterval(
      () => this.processLogs(),
      this.flushInterval,
    );
  }

  private async initializeStream(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const maxRetries = 3;
    const retryDelay = 1000;
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        // 检查 Stream 是否存在
        const streamInfo = await this.redisService.xinfo(this.STREAM_KEY);

        if (!streamInfo) {
          // Stream 不存在，创建新的 Stream 和消费者组
          await this.redisService.xgroupCreate(
            this.STREAM_KEY,
            this.CONSUMER_GROUP,
            '0',
            { mkstream: true },
          );
        } else {
          // Stream 存在，检查消费者组是否存在
          try {
            await this.redisService.xinfoGroup(
              this.STREAM_KEY,
              this.CONSUMER_GROUP,
            );
          } catch (error) {
            // 消费者组不存在，创建新的消费者组
            await this.redisService.xgroupCreate(
              this.STREAM_KEY,
              this.CONSUMER_GROUP,
              '0',
            );
          }
        }

        this.isInitialized = true;
        console.log('Stream 初始化成功');
        return;
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          const delay = retryDelay * Math.pow(2, i);
          console.warn(`Stream 初始化失败，${delay}ms 后重试:`, error.message);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `Stream 初始化失败，已重试 ${maxRetries} 次: ${lastError?.message}`,
    );
  }

  async onModuleDestroy() {
    if (this.flushIntervalId) {
      clearInterval(this.flushIntervalId);
    }
    await this.processLogs();
  }

  async addLog(
    diagnosisId: number,
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    // 确保 Stream 已初始化
    if (!this.isInitialized) {
      await this.initializeStream();
    }

    const logEntry: LogEntry = {
      diagnosisId,
      level,
      message,
      metadata,
      timestamp: Date.now(),
    };

    try {
      await this.redisService.xadd(this.STREAM_KEY, logEntry);
    } catch (error) {
      console.error('添加日志到 Stream 失败:', error);
      await this.createLog(diagnosisId, level, message, metadata);
    }
  }

  private async processLogs(): Promise<void> {
    // 确保 Stream 已初始化
    if (!this.isInitialized) {
      await this.initializeStream();
    }

    const startTime = Date.now();
    let processedCount = 0;

    try {
      // 从消费者组读取消息
      const messages = await this.redisService.xreadgroup(
        this.STREAM_KEY,
        this.CONSUMER_GROUP,
        this.CONSUMER_NAME,
        {
          count: this.batchSize,
          noack: false,
        },
      );

      if (!messages || messages.length === 0) {
        return;
      }

      // 使用数据库事务处理消息
      await this.logRepository.manager.transaction(
        async (transactionalEntityManager) => {
          const entities = messages
            .map((msg) => {
              try {
                const log = msg.data as LogEntry;
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
                console.error('解析日志数据失败:', error, '原始数据:', msg);
                return null;
              }
            })
            .filter((entity): entity is DiagnosisLog => entity !== null);

          if (entities.length === 0) {
            return;
          }

          await this.saveWithRetry(entities, transactionalEntityManager);
          processedCount = entities.length;

          // 确认消息已处理
          const messageIds = messages.map((msg) => msg.id);
          await this.redisService.xack(
            this.STREAM_KEY,
            this.CONSUMER_GROUP,
            messageIds,
          );
        },
      );

      // 更新指标
      const processTime = Date.now() - startTime;
      const pendingInfo = await this.redisService.xpending(
        this.STREAM_KEY,
        this.CONSUMER_GROUP,
      );
      const metrics: LogMetrics = {
        processedCount,
        processTime,
        errorCount: 0,
        lastProcessedAt: new Date().toISOString(),
        pendingCount: pendingInfo.length,
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
