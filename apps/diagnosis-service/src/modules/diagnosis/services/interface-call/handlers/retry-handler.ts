import { Injectable, Logger } from "@nestjs/common";
import { LogLevel } from "@app/database/entities";
import { DiagnosisLogService } from "../../diagnosis-log.service";

@Injectable()
export class RetryHandler {
  private readonly logger = new Logger(RetryHandler.name);
  private diagnosisId: number;

  constructor(private readonly logService: DiagnosisLogService) {}

  initialize(diagnosisId: number) {
    this.diagnosisId = diagnosisId;
  }

  /**
   * 带延迟的重试机制
   */
  async retryWithDelay<T>(
    operation: () => Promise<T>,
    retryCount: number,
    retryDelay: number,
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < retryCount; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        this.log(LogLevel.WARN, `第 ${i + 1} 次重试失败: ${error.message}`);
        
        if (i < retryCount - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    this.log(LogLevel.ERROR, `重试 ${retryCount} 次后仍然失败: ${lastError?.message}`);
    throw lastError;
  }

  /**
   * 记录日志
   */
  private async log(level: LogLevel, message: string, metadata?: Record<string, any>) {
    this.logger[level](message);
    await this.logService.addLog(this.diagnosisId, level, message, metadata);
  }
} 