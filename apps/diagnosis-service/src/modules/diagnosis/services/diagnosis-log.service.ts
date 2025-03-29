import {
  DiagnosisLog,
  LogLevel,
} from '@app/database/entities/diagnosis-log.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Between } from 'typeorm';

@Injectable()
export class DiagnosisLogService {
  private readonly logQueue: Array<{
    diagnosisId: number;
    level: LogLevel;
    message: string;
    metadata?: Record<string, any>;
  }> = [];
  private isProcessing = false;
  private readonly batchSize = 10;
  private readonly flushInterval = 1000; // 1秒

  constructor(
    @InjectRepository(DiagnosisLog)
    private readonly logRepository: Repository<DiagnosisLog>,
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
    this.logQueue.push({ diagnosisId, level, message, metadata });

    // 如果队列达到批处理大小，立即处理
    if (this.logQueue.length >= this.batchSize) {
      await this.flushLogs();
    }
  }

  // 刷新日志到数据库
  private async flushLogs(): Promise<void> {
    if (this.isProcessing || this.logQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    try {
      const logsToProcess = this.logQueue.splice(0, this.batchSize);
      const entities = logsToProcess.map((log) =>
        this.logRepository.create(log),
      );
      await this.logRepository.save(entities);
    } catch (error) {
      // 如果保存失败，将日志放回队列
      this.logQueue.unshift(...this.logQueue.splice(0, this.batchSize));
      console.error('保存日志失败:', error);
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
}
