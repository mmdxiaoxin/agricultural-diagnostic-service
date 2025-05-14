import { DatabaseModule } from '@app/database';
import { ConsulModule } from '@app/consul';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { DatasetModule } from './modules/dataset/dataset.module';
import { FileModule } from './modules/file/file.module';
import { HealthModule } from './modules/health/health.module';
import {
  FILE_SERVICE_NAME,
  FILE_SERVICE_HTTP_PORT,
} from 'config/microservice.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule.register(),
    ConsulModule.register({
      serviceName: FILE_SERVICE_NAME,
      servicePort: FILE_SERVICE_HTTP_PORT,
      healthCheckPath: '/health',
      healthCheckInterval: '30s',
      healthCheckTimeout: '5s',
    }),
    FileModule,
    DatasetModule,
    PrometheusModule.register(),
    HealthModule,
  ],
})
export class AppModule {}
