import { DatabaseModule } from '@app/database';
import { ConsulModule } from '@app/consul';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { HealthModule } from './modules/health/health.module';
import {
  KNOWLEDGE_SERVICE_NAME,
  KNOWLEDGE_SERVICE_HTTP_PORT,
} from 'config/microservice.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule.register(),
    ConsulModule.register({
      serviceName: KNOWLEDGE_SERVICE_NAME,
      servicePort: KNOWLEDGE_SERVICE_HTTP_PORT,
      healthCheckPath: '/health',
      healthCheckInterval: '30s',
      healthCheckTimeout: '5s',
    }),
    KnowledgeModule,
    PrometheusModule.register(),
    HealthModule,
  ],
})
export class AppModule {}
