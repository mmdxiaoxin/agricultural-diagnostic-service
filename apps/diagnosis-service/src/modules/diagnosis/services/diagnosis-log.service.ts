import {
  DiagnosisLog,
  LogLevel,
} from '@app/database/entities/diagnosis-log.entity';
import { RedisService } from '@app/redis';
import { PageQueryDto } from '@common/dto/page-query.dto';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { formatResponse } from '@shared/helpers/response.helper';
import { createHash } from 'crypto';
import { Between, In, Repository } from 'typeorm';

interface LogEntry {
  diagnosisId: number;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
  timestamp: number;
  messageId?: string;
  retryCount?: number;
  sequence: number;
}

interface LogMetrics {
  processedCount: number;
  processTime: number;
  errorCount: number;
  lastProcessedAt: string;
  pendingCount: number;
  batchSize: number;
  processingInterval: number;
  deadLetterCount: number;
  retryCount: number;
}

@Injectable()
export class DiagnosisLogService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DiagnosisLogService.name);
  private readonly STREAM_KEY = 'diagnosis:log:stream';
  private readonly CONSUMER_GROUP = 'diagnosis:log:group';
  private readonly CONSUMER_NAME = 'diagnosis:log:consumer';
  private readonly REDIS_METRICS_KEY = 'diagnosis:log:metrics';
  private readonly REDIS_ERROR_COUNT_KEY = 'diagnosis:log:metrics:error_count';
  private readonly REDIS_BATCH_SIZE_KEY = 'diagnosis:log:metrics:batch_size';
  private readonly REDIS_INTERVAL_KEY = 'diagnosis:log:metrics:interval';
  private readonly REDIS_PROCESSED_IDS_KEY = 'diagnosis:log:processed_ids';
  private readonly REDIS_DEAD_LETTER_KEY = 'diagnosis:log:dead_letter';
  private readonly REDIS_CACHE_KEY = 'diagnosis:log:cache';
  private readonly REDIS_SEQUENCE_KEY = 'diagnosis:log:sequence';

  private readonly MIN_BATCH_SIZE = 20; // 最小批处理大小
  private readonly MAX_BATCH_SIZE = 100; // 最大批处理大小
  private readonly MIN_INTERVAL = 100; // 最小间隔
  private readonly MAX_INTERVAL = 2000; // 最大间隔
  private readonly MAX_RETRY_COUNT = 3; // 最大重试次数
  private readonly CACHE_TTL = 300; // 缓存过期时间

  private readonly MAX_MESSAGE_LENGTH = 16000; // 消息最大长度 (约5KB)
  private readonly MAX_METADATA_SIZE = 8000; // 元数据最大大小 (约2.5KB)

  private batchSize = 100;
  private flushInterval = 1000;
  private flushIntervalId: NodeJS.Timeout;
  private isInitialized = false;
  private isProcessing = false;
  private consecutiveErrors = 0;
  private lastProcessTime = 0;
  private metricsUpdateInterval: NodeJS.Timeout;

  constructor(
    @InjectRepository(DiagnosisLog)
    private readonly logRepository: Repository<DiagnosisLog>,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit() {
    try {
      // 按顺序初始化各个组件
      await this.initializeStream();
      await this.initializeMetrics();
      this.startProcessing();
      this.startMetricsUpdate();
      this.logger.log('DiagnosisLogService 初始化成功');
    } catch (error) {
      this.logger.error('DiagnosisLogService 初始化失败:', error);
      throw error;
    }
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
    const processWithInterval = async () => {
      await this.processLogs();
      // 动态调整下一次处理的时间
      this.flushIntervalId = setTimeout(
        processWithInterval,
        this.flushInterval,
      );
    };

    processWithInterval();
  }

  private async adjustProcessingParameters(
    processTime: number,
    errorCount: number,
  ): Promise<void> {
    // 更新上次处理时间
    this.lastProcessTime = processTime;

    // 根据处理时间和错误率动态调整批处理大小和间隔
    if (errorCount > 0) {
      // 发生错误时，减小批处理大小并增加间隔
      this.batchSize = Math.max(
        this.MIN_BATCH_SIZE,
        Math.floor(this.batchSize * 0.8),
      );
      this.flushInterval = Math.min(
        this.MAX_INTERVAL,
        Math.floor(this.flushInterval * 1.2),
      );
    } else {
      // 根据处理时间动态调整
      if (processTime < 200) {
        // 处理时间很短，可以增加批处理大小
        this.batchSize = Math.min(
          this.MAX_BATCH_SIZE,
          Math.floor(this.batchSize * 1.2),
        );
        this.flushInterval = Math.max(
          this.MIN_INTERVAL,
          Math.floor(this.flushInterval * 0.9),
        );
      } else if (processTime > 800) {
        // 处理时间较长，需要减小批处理大小
        this.batchSize = Math.max(
          this.MIN_BATCH_SIZE,
          Math.floor(this.batchSize * 0.9),
        );
        this.flushInterval = Math.min(
          this.MAX_INTERVAL,
          Math.floor(this.flushInterval * 1.1),
        );
      }
    }

    // 保存调整后的参数
    await this.redisService.set(this.REDIS_BATCH_SIZE_KEY, this.batchSize);
    await this.redisService.set(this.REDIS_INTERVAL_KEY, this.flushInterval);

    // 记录调整日志
    this.logger.debug(
      `处理参数调整: 批处理大小=${this.batchSize}, 处理间隔=${this.flushInterval}ms, 处理时间=${processTime}ms`,
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
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
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
      60 * 60, // 1小时
    );
  }

  private estimateObjectSize(obj: any): number {
    if (!obj) return 0;
    // 估算 JSON 字符串的字节大小
    const jsonStr = JSON.stringify(obj);
    let byteSize = 0;
    for (let i = 0; i < jsonStr.length; i++) {
      const charCode = jsonStr.charCodeAt(i);
      if (charCode < 0x80) {
        byteSize += 1; // ASCII 字符
      } else if (charCode < 0x800) {
        byteSize += 2; // 2字节 UTF-8
      } else if (charCode < 0x10000) {
        byteSize += 3; // 3字节 UTF-8
      } else {
        byteSize += 4; // 4字节 UTF-8 (emoji 等)
      }
    }
    return byteSize;
  }

  private truncateMessage(message: string): string {
    if (message.length <= this.MAX_MESSAGE_LENGTH) {
      return message;
    }
    // 确保截断后的消息不会超过 MySQL TEXT 限制
    let truncated = message.slice(0, this.MAX_MESSAGE_LENGTH - 3) + '...';
    while (this.estimateObjectSize(truncated) > 65535) {
      // MySQL TEXT 限制
      truncated = truncated.slice(0, -4) + '...';
    }
    return truncated;
  }

  private truncateMetadata(metadata: Record<string, any>): Record<string, any> {
    if (!metadata) return {};

    const size = this.estimateObjectSize(metadata);
    if (size <= this.MAX_METADATA_SIZE) {
      return metadata;
    }

    // 如果元数据太大，只保留最重要的字段
    const result: Record<string, any> = {};
    const keys = Object.keys(metadata);
    let currentSize = 0;

    for (const key of keys) {
      const value = metadata[key];
      const valueSize = this.estimateObjectSize(value);

      // 确保不会超过 MySQL TEXT 限制
      if (
        currentSize + valueSize > this.MAX_METADATA_SIZE ||
        this.estimateObjectSize(result) > 65535
      ) {
        break;
      }

      result[key] = value;
      currentSize += valueSize;
    }

    return result;
  }

  private async getNextSequence(diagnosisId: number): Promise<number> {
    const key = `${this.REDIS_SEQUENCE_KEY}:${diagnosisId}`;
    // 使用 INCR 命令原子性地增加序列号
    const sequence = await this.redisService.getClient().incr(key);
    // 设置过期时间（24小时）
    await this.redisService.getClient().expire(key, 24 * 60 * 60);
    return sequence;
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

    // 获取序号
    const sequence = await this.getNextSequence(diagnosisId);

    // 快速检查消息长度和字节大小
    const messageBytes = this.estimateObjectSize(message);
    if (message.length > this.MAX_MESSAGE_LENGTH || messageBytes > 65535) {
      message = this.truncateMessage(message);
      this.logger.warn(
        `日志消息被截断，原始长度: ${message.length}，原始字节大小: ${messageBytes}`,
      );
    }

    // 快速检查元数据大小
    if (metadata) {
      const metadataSize = this.estimateObjectSize(metadata);
      if (metadataSize > this.MAX_METADATA_SIZE || metadataSize > 65535) {
        metadata = this.truncateMetadata(metadata);
        this.logger.warn(`日志元数据被截断，原始字节大小: ${metadataSize}`);
      }
    }

    const logEntry: LogEntry = {
      diagnosisId,
      level,
      message,
      metadata,
      timestamp: Date.now(),
      sequence,
    };

    // 生成消息ID
    const messageId = this.generateMessageId(logEntry);
    logEntry.messageId = messageId;

    try {
      await this.redisService.xadd(this.STREAM_KEY, logEntry);
    } catch (error) {
      this.logger.error('添加日志到 Stream 失败:', error);
      if (!(await this.isMessageProcessed(messageId))) {
        await this.createLog(diagnosisId, level, message, sequence, metadata);
        await this.markMessageAsProcessed(messageId);
      }
    }
  }

  private async processLogs(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    // 添加检查，如果没有待处理的消息，直接返回
    const pendingCount = await this.redisService.xlen(this.STREAM_KEY);
    if (pendingCount === 0) {
      // 如果没有待处理的消息，增加处理间隔
      this.flushInterval = Math.min(
        this.MAX_INTERVAL,
        this.flushInterval * 1.5,
      );
      await this.redisService.set(this.REDIS_INTERVAL_KEY, this.flushInterval);
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();
    let processedCount = 0;
    let errorCount = 0;

    try {
      // 使用非阻塞读取
      const messages = await this.redisService.xreadgroup(
        this.STREAM_KEY,
        this.CONSUMER_GROUP,
        this.CONSUMER_NAME,
        {
          count: this.batchSize,
          noack: false,
          block: 0, // 改为非阻塞读取
        },
      );

      if (!messages || messages.length === 0) {
        this.isProcessing = false;
        return;
      }

      // 按诊断ID分组处理消息
      const groupedMessages = new Map<number, any[]>();
      messages.forEach((msg) => {
        const log = msg.data as LogEntry;
        if (!log.diagnosisId) return;

        if (!groupedMessages.has(log.diagnosisId)) {
          groupedMessages.set(log.diagnosisId, []);
        }
        const group = groupedMessages.get(log.diagnosisId);
        if (group) {
          group.push(msg);
        }
      });

      // 分离数据库操作和Redis操作
      const savedEntities: DiagnosisLog[] = [];
      const messageIds: string[] = [];
      const processedMessageIds: string[] = [];

      // 1. 先处理数据库操作
      await this.logRepository.manager.transaction(
        async (transactionalEntityManager) => {
          for (const [diagnosisId, groupMessages] of groupedMessages) {
            // 按序号排序
            groupMessages.sort((a, b) => {
              const seqA = (a.data as LogEntry).sequence || 0;
              const seqB = (b.data as LogEntry).sequence || 0;
              return seqA - seqB;
            });

            const processedMessages = await Promise.all(
              groupMessages.map(async (msg) => {
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
                      return null;
                    }
                    processedMessageIds.push(log.messageId);
                  }

                  const entity = transactionalEntityManager.create(
                    DiagnosisLog,
                    {
                      diagnosisId: log.diagnosisId,
                      level: log.level,
                      message: log.message,
                      metadata: log.metadata || {},
                      createdAt: new Date(log.timestamp || Date.now()),
                      sequence: log.sequence,
                    },
                  );

                  messageIds.push(msg.id);
                  return entity;
                } catch (error) {
                  this.logger.error(
                    '解析日志数据失败:',
                    error,
                    '原始数据:',
                    msg,
                  );
                  errorCount++;
                  return null;
                }
              }),
            );

            const entities = processedMessages.filter(
              (entity): entity is DiagnosisLog => entity !== null,
            );

            if (entities.length === 0) {
              continue;
            }

            const saved = await this.saveWithRetry(
              entities,
              transactionalEntityManager,
            );
            savedEntities.push(...saved);
            processedCount += entities.length;
          }
        },
      );

      // 2. 如果数据库操作成功，再处理Redis操作
      if (savedEntities.length > 0) {
        // 批量标记消息为已处理
        if (processedMessageIds.length > 0) {
          const pipeline = this.redisService.pipeline();
          processedMessageIds.forEach((messageId) => {
            pipeline.setex(
              `${this.REDIS_PROCESSED_IDS_KEY}:${messageId}`,
              60 * 60,
              '1',
            );
          });
          await pipeline.exec();
        }

        // 确认消息
        if (messageIds.length > 0) {
          await this.redisService.xack(
            this.STREAM_KEY,
            this.CONSUMER_GROUP,
            messageIds,
          );
        }
      }

      const processTime = Date.now() - startTime;
      this.lastProcessTime = processTime;

      // 只有在实际处理了消息时才更新指标
      if (processedCount > 0) {
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
          deadLetterCount: 0,
          retryCount: 0,
        };

        await this.redisService.set(this.REDIS_METRICS_KEY, metrics, 3600);
        await this.adjustProcessingParameters(processTime, errorCount);
      }

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
  ): Promise<DiagnosisLog[]> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const saved = await transactionalEntityManager.save(entities);
        return saved;
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
    sequence: number,
    metadata?: Record<string, any>,
  ): Promise<DiagnosisLog> {
    const log = this.logRepository.create({
      diagnosisId,
      level,
      message,
      sequence,
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
    const cacheKey = `${this.REDIS_CACHE_KEY}:${diagnosisId}`;
    const cachedLogs = await this.redisService.get<DiagnosisLog[]>(cacheKey);
    if (cachedLogs) {
      return formatResponse(200, cachedLogs, '诊断日志获取成功(缓存)');
    }

    const logs = await this.logRepository.find({
      where: { diagnosisId },
      order: {
        sequence: 'DESC',
        createdAt: 'DESC',
      },
    });

    await this.redisService.set(cacheKey, logs, this.CACHE_TTL);
    return formatResponse(200, logs, '诊断日志获取成功');
  }

  async findList(diagnosisId: number, query: PageQueryDto) {
    const { page = 1, pageSize = 10 } = query;

    // 获取最新的序列号作为缓存版本
    const lastSequence =
      (await this.redisService.get<number>(
        `${this.REDIS_SEQUENCE_KEY}:${diagnosisId}`,
      )) || 0;
    const cacheKey = `${this.REDIS_CACHE_KEY}:list:${diagnosisId}:${page}:${pageSize}:${lastSequence}`;

    // 尝试从缓存获取
    const cachedResult = await this.redisService.get<{
      list: DiagnosisLog[];
      total: number;
      sequence: number;
    }>(cacheKey);

    // 验证缓存数据的序列号是否是最新的
    if (cachedResult && cachedResult.sequence === lastSequence) {
      return formatResponse(
        200,
        { list: cachedResult.list, total: cachedResult.total, page, pageSize },
        '诊断日志列表获取成功(缓存)',
      );
    }

    // 如果缓存不存在或已过期，从数据库查询
    let [logs, total] = await this.logRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where: { diagnosisId },
      order: {
        createdAt: 'DESC', // 首先按创建时间降序
        sequence: 'DESC', // 然后按序列号降序
      },
    });

    // 确保日志按时间顺序正确排序
    logs = logs.sort((a, b) => {
      // 首先按创建时间排序
      const timeDiff = b.createdAt.getTime() - a.createdAt.getTime();
      if (timeDiff !== 0) return timeDiff;
      // 如果时间相同，则按序列号排序
      return b.sequence - a.sequence;
    });

    // 更新缓存，包含序列号信息
    await this.redisService.set(
      cacheKey,
      {
        list: logs,
        total,
        sequence: lastSequence,
      },
      this.CACHE_TTL,
    );

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
    const cacheKey = `${this.REDIS_CACHE_KEY}:range:${diagnosisId}:${startTime.getTime()}:${endTime.getTime()}`;

    // 尝试从缓存获取
    const cachedLogs = await this.redisService.get<DiagnosisLog[]>(cacheKey);
    if (cachedLogs) {
      return cachedLogs;
    }

    const logs = await this.logRepository.find({
      where: {
        diagnosisId,
        createdAt: Between(startTime, endTime),
      },
      order: {
        sequence: 'ASC',
        createdAt: 'ASC',
      },
    });

    // 更新缓存
    await this.redisService.set(cacheKey, logs, this.CACHE_TTL);
    return logs;
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

  private startMetricsUpdate(): void {
    this.metricsUpdateInterval = setInterval(async () => {
      try {
        const metrics = await this.findMetrics();
        if (metrics) {
          // 检查错误率
          if (metrics.errorCount > 0 && metrics.processedCount > 0) {
            const errorRate = metrics.errorCount / metrics.processedCount;
            if (errorRate > 0.1) {
              // 错误率超过10%
              this.logger.warn(
                `日志处理错误率过高: ${(errorRate * 100).toFixed(2)}%`,
              );
            }
          }

          // 检查处理延迟
          if (this.lastProcessTime > 1000) {
            // 处理时间超过1秒
            this.logger.warn(`日志处理延迟过高: ${this.lastProcessTime}ms`);
          }

          // 检查死信队列
          if (metrics.deadLetterCount > 100) {
            // 死信数量超过100
            this.logger.warn(`死信队列积压: ${metrics.deadLetterCount}条`);
          }

          // 检查处理效率
          if (metrics.processedCount > 0) {
            const efficiency =
              metrics.processedCount / (this.lastProcessTime / 1000);
            if (efficiency < 10) {
              // 每秒处理消息数小于10
              this.logger.warn(`处理效率过低: ${efficiency.toFixed(2)}条/秒`);
            }
          }
        }
      } catch (error) {
        this.logger.error('更新指标失败:', error);
      }
    }, 60000); // 每分钟更新一次
  }

  private async moveToDeadLetter(message: any, error: Error): Promise<void> {
    const deadLetter = {
      ...message,
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
    };
    const key = `${this.REDIS_DEAD_LETTER_KEY}:${Date.now()}`;
    await this.redisService.set(key, deadLetter, 7 * 24 * 60 * 60); // 7天过期
  }

  private async processDeadLetter(): Promise<void> {
    // 获取所有死信消息的键
    const deadLetterKeys =
      (await this.redisService.get<string[]>(this.REDIS_DEAD_LETTER_KEY)) || [];
    if (deadLetterKeys.length === 0) {
      return;
    }

    // 获取最早的一条死信消息
    const oldestKey = deadLetterKeys[0];
    const deadLetter = await this.redisService.get<{
      data: LogEntry;
      error: {
        message: string;
        stack: string;
        timestamp: string;
      };
    }>(oldestKey);

    if (!deadLetter) {
      // 如果消息不存在，从列表中移除
      await this.redisService.set(
        this.REDIS_DEAD_LETTER_KEY,
        deadLetterKeys.slice(1),
        7 * 24 * 60 * 60,
      );
      return;
    }

    try {
      const log = deadLetter.data;
      if (log.retryCount && log.retryCount >= this.MAX_RETRY_COUNT) {
        this.logger.error('消息重试次数超过限制，丢弃:', log);
        // 从列表中移除
        await this.redisService.set(
          this.REDIS_DEAD_LETTER_KEY,
          deadLetterKeys.slice(1),
          7 * 24 * 60 * 60,
        );
        return;
      }

      log.retryCount = (log.retryCount || 0) + 1;
      await this.addLog(log.diagnosisId, log.level, log.message, log.metadata);
      // 从列表中移除
      await this.redisService.set(
        this.REDIS_DEAD_LETTER_KEY,
        deadLetterKeys.slice(1),
        7 * 24 * 60 * 60,
      );
    } catch (error) {
      this.logger.error('处理死信消息失败:', error);
      await this.moveToDeadLetter(deadLetter, error);
    }
  }

  @Cron('0 */5 * * * *') // 每5分钟执行一次
  async processDeadLetters() {
    try {
      await this.processDeadLetter();
    } catch (error) {
      this.logger.error('处理死信队列失败:', error);
    }
  }

  private async adjustProcessingInterval(pendingCount: number): Promise<void> {
    if (pendingCount === 0) {
      // 如果没有待处理的消息，增加处理间隔
      this.flushInterval = Math.min(
        this.MAX_INTERVAL,
        this.flushInterval * 1.5,
      );
    } else if (pendingCount > this.batchSize * 2) {
      // 如果待处理消息数量超过批处理大小的2倍，减少处理间隔
      this.flushInterval = Math.max(
        this.MIN_INTERVAL,
        this.flushInterval * 0.8,
      );
    }

    await this.redisService.set(this.REDIS_INTERVAL_KEY, this.flushInterval);
  }
}
