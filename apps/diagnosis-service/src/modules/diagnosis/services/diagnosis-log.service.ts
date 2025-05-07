import {
  DiagnosisLog,
  LogLevel,
} from '@app/database/entities/diagnosis-log.entity';
import { RedisService } from '@app/redis';
import { PageQueryDto } from '@common/dto/page-query.dto';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { formatResponse } from '@shared/helpers/response.helper';
import { createHash } from 'crypto';
import { Between, Repository } from 'typeorm';

interface LogEntry {
  diagnosisId: number;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
  timestamp: number;
  messageId?: string;
}

interface LogMetrics {
  processedCount: number;
  processTime: number;
  errorCount: number;
  lastProcessedAt: string;
  pendingCount: number;
  batchSize: number;
  processingInterval: number;
}

@Injectable()
export class DiagnosisLogService implements OnModuleDestroy {
  private readonly logger = new Logger(DiagnosisLogService.name);
  private readonly STREAM_KEY = 'diagnosis:log:stream';
  private readonly CONSUMER_GROUP = 'diagnosis:log:group';
  private readonly CONSUMER_NAME = 'diagnosis:log:consumer';
  private readonly REDIS_METRICS_KEY = 'diagnosis:log:metrics';
  private readonly REDIS_ERROR_COUNT_KEY = 'diagnosis:log:metrics:error_count';
  private readonly REDIS_BATCH_SIZE_KEY = 'diagnosis:log:metrics:batch_size';
  private readonly REDIS_INTERVAL_KEY = 'diagnosis:log:metrics:interval';
  private readonly REDIS_PROCESSED_IDS_KEY = 'diagnosis:log:processed_ids';

  private readonly MIN_BATCH_SIZE = 50;
  private readonly MAX_BATCH_SIZE = 500;
  private readonly MIN_INTERVAL = 100;
  private readonly MAX_INTERVAL = 5000;

  private batchSize = 100;
  private flushInterval = 1000;
  private flushIntervalId: NodeJS.Timeout;
  private isInitialized = false;
  private isProcessing = false;
  private consecutiveErrors = 0;
  private lastProcessTime = 0;

  constructor(
    @InjectRepository(DiagnosisLog)
    private readonly logRepository: Repository<DiagnosisLog>,
    private readonly redisService: RedisService,
  ) {
    this.initializeStream().catch((error) => {
      this.logger.error('初始化 Stream 失败:', error);
    });
    this.initializeMetrics().catch((error) => {
      this.logger.error('初始化指标失败:', error);
    });
    this.startProcessing();
  }

  private async initializeMetrics(): Promise<void> {
    const savedBatchSize = await this.redisService.get<number>(
      this.REDIS_BATCH_SIZE_KEY,
    );
    const savedInterval = await this.redisService.get<number>(
      this.REDIS_INTERVAL_KEY,
    );

    if (savedBatchSize) this.batchSize = savedBatchSize;
    if (savedInterval) this.flushInterval = savedInterval;
  }

  private startProcessing(): void {
    this.flushIntervalId = setInterval(
      () => this.processLogs(),
      this.flushInterval,
    );
  }

  private async adjustProcessingParameters(
    processTime: number,
    errorCount: number,
  ): Promise<void> {
    if (errorCount > 0) {
      this.batchSize = Math.max(
        this.MIN_BATCH_SIZE,
        Math.floor(this.batchSize * 0.8),
      );
      this.flushInterval = Math.min(
        this.MAX_INTERVAL,
        Math.floor(this.flushInterval * 1.2),
      );
    } else if (processTime < 500) {
      this.batchSize = Math.min(
        this.MAX_BATCH_SIZE,
        Math.floor(this.batchSize * 1.1),
      );
      this.flushInterval = Math.max(
        this.MIN_INTERVAL,
        Math.floor(this.flushInterval * 0.9),
      );
    }

    await this.redisService.set(this.REDIS_BATCH_SIZE_KEY, this.batchSize);
    await this.redisService.set(this.REDIS_INTERVAL_KEY, this.flushInterval);
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
        const streamInfo = await this.redisService
          .xinfo(this.STREAM_KEY)
          .catch(() => null);

        if (!streamInfo) {
          await this.redisService.xgroupCreate(
            this.STREAM_KEY,
            this.CONSUMER_GROUP,
            '0',
            { mkstream: true },
          );
        } else {
          try {
            await this.redisService.xinfoGroup(
              this.STREAM_KEY,
              this.CONSUMER_GROUP,
            );
          } catch (error) {
            if (error.message.includes('BUSYGROUP')) {
              this.logger.log('消费者组已存在，继续执行');
            } else {
              await this.redisService.xgroupCreate(
                this.STREAM_KEY,
                this.CONSUMER_GROUP,
                '0',
              );
            }
          }
        }

        this.isInitialized = true;
        this.logger.log('Stream 初始化成功');
        return;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Stream 初始化失败，第 ${i + 1} 次尝试:`,
          error.message,
        );

        if (i < maxRetries - 1) {
          const delay = retryDelay * Math.pow(2, i);
          this.logger.warn(`等待 ${delay}ms 后重试...`);
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

  private generateMessageId(logEntry: LogEntry): string {
    const content = `${logEntry.diagnosisId}:${logEntry.level}:${logEntry.message}:${logEntry.timestamp}`;
    return createHash('sha256').update(content).digest('hex');
  }

  private async isMessageProcessed(messageId: string): Promise<boolean> {
    const result = await this.redisService.get<boolean>(
      `${this.REDIS_PROCESSED_IDS_KEY}:${messageId}`,
    );
    return result === true;
  }

  private async markMessageAsProcessed(messageId: string): Promise<void> {
    await this.redisService.set(
      `${this.REDIS_PROCESSED_IDS_KEY}:${messageId}`,
      true,
      7 * 24 * 60 * 60,
    );
  }

  async addLog(
    diagnosisId: number,
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
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

    const messageId = this.generateMessageId(logEntry);
    logEntry.messageId = messageId;

    if (await this.isMessageProcessed(messageId)) {
      this.logger.debug(`消息已处理，跳过: ${messageId}`);
      return;
    }

    try {
      await this.redisService.xadd(this.STREAM_KEY, logEntry);
    } catch (error) {
      this.logger.error('添加日志到 Stream 失败:', error);
      if (!(await this.isMessageProcessed(messageId))) {
        await this.createLog(diagnosisId, level, message, metadata);
        await this.markMessageAsProcessed(messageId);
      }
    }
  }

  private async processLogs(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();
    let processedCount = 0;
    let errorCount = 0;

    try {
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
        this.isProcessing = false;
        return;
      }

      await this.logRepository.manager.transaction(
        async (transactionalEntityManager) => {
          const processedMessages = await Promise.all(
            messages.map(async (msg) => {
              try {
                const log = msg.data as LogEntry;
                if (!log.diagnosisId || !log.level || !log.message) {
                  this.logger.error('日志数据不完整:', log);
                  errorCount++;
                  return null;
                }

                if (log.messageId) {
                  const isProcessed = await this.isMessageProcessed(
                    log.messageId,
                  );
                  if (isProcessed) {
                    this.logger.debug(`消息已处理，跳过: ${log.messageId}`);
                    return null;
                  }
                }

                return transactionalEntityManager.create(DiagnosisLog, {
                  diagnosisId: log.diagnosisId,
                  level: log.level,
                  message: log.message,
                  metadata: log.metadata || {},
                  createdAt: new Date(log.timestamp || Date.now()),
                });
              } catch (error) {
                this.logger.error('解析日志数据失败:', error, '原始数据:', msg);
                errorCount++;
                return null;
              }
            }),
          );

          const entities = processedMessages.filter(
            (entity): entity is DiagnosisLog => entity !== null,
          );

          if (entities.length === 0) {
            return;
          }

          await this.saveWithRetry(entities, transactionalEntityManager);
          processedCount = entities.length;

          await Promise.all(
            messages.map(async (msg) => {
              const log = msg.data as LogEntry;
              if (log.messageId) {
                await this.markMessageAsProcessed(log.messageId);
              }
            }),
          );

          const messageIds = messages.map((msg) => msg.id);
          await this.redisService.xack(
            this.STREAM_KEY,
            this.CONSUMER_GROUP,
            messageIds,
          );
        },
      );

      const processTime = Date.now() - startTime;
      this.lastProcessTime = processTime;
      const pendingInfo = await this.redisService.xpending(
        this.STREAM_KEY,
        this.CONSUMER_GROUP,
      );

      const metrics: LogMetrics = {
        processedCount,
        processTime,
        errorCount,
        lastProcessedAt: new Date().toISOString(),
        pendingCount: pendingInfo.length,
        batchSize: this.batchSize,
        processingInterval: this.flushInterval,
      };

      await this.redisService.set(this.REDIS_METRICS_KEY, metrics, 3600);

      await this.adjustProcessingParameters(processTime, errorCount);

      if (errorCount === 0) {
        this.consecutiveErrors = 0;
      } else {
        this.consecutiveErrors++;
      }
    } catch (error) {
      this.consecutiveErrors++;
      await this.redisService.increment(this.REDIS_ERROR_COUNT_KEY);
      this.logger.error('保存日志失败:', {
        error: error.message,
        code: error.code,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState,
        stack: error.stack,
      });

      if (this.consecutiveErrors > 3) {
        this.flushInterval = Math.min(
          this.MAX_INTERVAL,
          this.flushInterval * 2,
        );
        await this.redisService.set(
          this.REDIS_INTERVAL_KEY,
          this.flushInterval,
        );
      }

      throw error;
    } finally {
      this.isProcessing = false;
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

  async findAll(diagnosisId: number) {
    const logs = await this.logRepository.find({
      where: { diagnosisId },
      order: { createdAt: 'DESC' },
    });
    return formatResponse(200, logs, '诊断日志获取成功');
  }

  async findList(diagnosisId: number, query: PageQueryDto) {
    const { page = 1, pageSize = 10 } = query;
    const [logs, total] = await this.logRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where: { diagnosisId },
      order: { createdAt: 'DESC' },
    });
    return formatResponse(
      200,
      { list: logs, total, page, pageSize },
      '诊断日志列表获取成功',
    );
  }

  async findByRange(
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

  async findMetrics(): Promise<LogMetrics | null> {
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
      this.logger.error('清理过期日志失败:', error);
    }
  }
}
