import { Injectable, Logger } from "@nestjs/common";
import { LogLevel } from "@app/database/entities";
import { DiagnosisLogService } from "../../diagnosis-log.service";
import { PollingCondition, PollingOperator } from "../types/interface-call.types";

@Injectable()
export class PollingHandler {
  private readonly logger = new Logger(PollingHandler.name);
  private diagnosisId: number;

  constructor(private readonly logService: DiagnosisLogService) {}

  initialize(diagnosisId: number) {
    this.diagnosisId = diagnosisId;
  }

  /**
   * 轮询执行
   */
  async pollWithTimeout<T>(
    operation: () => Promise<T>,
    interval: number,
    maxAttempts: number,
    timeout: number,
    condition?: PollingCondition,
  ): Promise<T> {
    const startTime = Date.now();
    let attempts = 0;

    while (attempts < maxAttempts) {
      if (Date.now() - startTime > timeout) {
        this.log(LogLevel.ERROR, '轮询超时', {
          timeout,
          maxAttempts,
          attempts,
        });
        throw new Error('轮询超时');
      }

      const result = await operation();
      
      if (this.checkPollingCondition(result, condition)) {
        return result;
      }

      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    this.log(LogLevel.ERROR, '达到最大轮询次数', {
      maxAttempts,
      attempts,
    });
    throw new Error('达到最大轮询次数');
  }

  /**
   * 检查轮询条件
   */
  private checkPollingCondition<T>(
    result: T,
    condition?: PollingCondition,
  ): boolean {
    if (!condition) {
      return true;
    }

    const { field, operator, value } = condition;
    const fieldValue = this.getNestedValue(result, field);

    switch (operator) {
      case PollingOperator.EQUALS:
        return fieldValue === value;
      case PollingOperator.NOT_EQUALS:
        return fieldValue !== value;
      case PollingOperator.CONTAINS:
        return fieldValue?.includes?.(value) ?? false;
      case PollingOperator.GREATER_THAN:
        return fieldValue > value;
      case PollingOperator.LESS_THAN:
        return fieldValue < value;
      case PollingOperator.EXISTS:
        return fieldValue !== undefined;
      case PollingOperator.NOT_EXISTS:
        return fieldValue === undefined;
      default:
        return false;
    }
  }

  /**
   * 获取嵌套值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }

  /**
   * 记录日志
   */
  private async log(level: LogLevel, message: string, metadata?: Record<string, any>) {
    this.logger[level](message);
    await this.logService.addLog(this.diagnosisId, level, message, metadata);
  }
} 