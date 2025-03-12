import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private requestCounter: client.Counter<string>;

  async onModuleInit() {
    client.collectDefaultMetrics(); // 采集默认的 Node.js 指标

    this.requestCounter = new client.Counter({
      name: 'microservice_requests_total',
      help: 'Total number of requests in microservice',
      labelNames: ['method', 'status'],
    });
  }

  incrementRequest(method: string, status: number) {
    this.requestCounter.inc({ method, status });
  }

  getMetrics(): Promise<string> {
    return client.register.metrics();
  }
}
