import { Injectable } from '@nestjs/common';
import { HttpCallService } from '../http-call.service';
import { InterfaceCallContext } from '../type';

@Injectable()
export class PollingCallStrategy {
  constructor(
    private readonly interval: number,
    private readonly maxAttempts: number,
    private readonly pollingCondition?: {
      field: string;
      operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'exists' | 'notExists';
      value?: any;
    },
  ) {}

  async execute(context: InterfaceCallContext): Promise<any> {
  
  }
} 