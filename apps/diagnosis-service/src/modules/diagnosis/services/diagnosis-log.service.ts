import {
  DiagnosisLog,
  LogLevel,
} from '@app/database/entities/diagnosis-log.entity';
import { RedisService } from '@app/redis';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';

@Injectable()
export class DiagnosisLogService {
  private readonly REDIS_LOG_QUEUE_KEY = 'diagnosis:log:queue';
  private readonly batchSize = 10;
  private readonly flushInterval = 1000; // 1秒
  private isProcessing = false;

  constructor(
    @InjectRepository(DiagnosisLog)
    private readonly logRepository: Repository<DiagnosisLog>,
    private readonly redisService: RedisService,
  ) {
    // 启动定时刷新
    setInterval(() => this.flushLogs(), this.flushInterval);
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

    // 将日志添加到 Redis 队列
    await this.redisService.rpush(this.REDIS_LOG_QUEUE_KEY, logEntry);

    // 如果队列长度达到批处理大小，立即处理
    const queueLength = await this.redisService.llen(this.REDIS_LOG_QUEUE_KEY);
    if (queueLength >= this.batchSize) {
      await this.flushLogs();
    }
  }

  // 刷新日志到数据库
  private async flushLogs(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();
    try {
      // 使用 Redis 事务确保原子性
      const result = await (
        await this.redisService.multi()
      ).exec(async (client) => {
        // 获取一批日志
        const logs = await client.lrange(
          this.REDIS_LOG_QUEUE_KEY,
          0,
          this.batchSize - 1,
        );
        if (logs.length > 0) {
          // 删除已获取的日志
          await client.ltrim(this.REDIS_LOG_QUEUE_KEY, logs.length, -1);
        }
        return logs;
      });

      // 从事务结果中提取日志数据
      const logsToProcess = result?.[0]?.[1] || [];
      if (!Array.isArray(logsToProcess) || logsToProcess.length === 0) {
        return;
      }

      // 解析日志并创建实体
      const entities = logsToProcess
        .map((logStr) => {
          try {
            const log = JSON.parse(logStr);
            // 确保所有必需字段都存在
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
            console.error('解析日志数据失败:', error);
            return null;
          }
        })
        .filter(Boolean); // 过滤掉无效的日志

      if (entities.length === 0) {
        return;
      }
      // 批量保存到数据库
      await this.logRepository.save(
        entities.filter((entity): entity is DiagnosisLog => entity !== null),
      );

      const processTime = Date.now() - startTime;
      const metrics = {
        processedCount: entities.length,
        processTime: processTime,
        errorCount: 0,
      };

      await this.redisService.set(
        'diagnosis:log:metrics',
        metrics,
        3600, // 1小时过期
      );
    } catch (error) {
      await this.redisService.increment('diagnosis:log:metrics:error_count');
      console.error('保存日志失败:', error);

      // 添加更详细的错误日志
      if (error.code === 'ER_NO_DEFAULT_FOR_FIELD') {
        console.error('数据库字段缺少默认值:', error.sqlMessage);
      }
    } finally {
      this.isProcessing = false;
    }
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

    await this.logRepository.delete({
      createdAt: Between(new Date(0), cutoffDate),
    });
  }
}
