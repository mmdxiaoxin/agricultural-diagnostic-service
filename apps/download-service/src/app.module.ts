import { DatabaseModule } from '@app/database';
import { ConsulModule } from '@app/consul';
import { Dataset, FileEntity } from '@app/database/entities';
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { DownloadController } from './app.controller';
import { DownloadService } from './app.service';
import { HealthModule } from './health/health.module';
import {
  DOWNLOAD_SERVICE_NAME,
  DOWNLOAD_SERVICE_HTTP_PORT,
} from 'config/microservice.config';

@Module({
  imports: [
    DatabaseModule.register(),
    DatabaseModule.forFeature([FileEntity, Dataset]),
    ConsulModule.register({
      serviceName: DOWNLOAD_SERVICE_NAME,
      servicePort: DOWNLOAD_SERVICE_HTTP_PORT,
      healthCheckPath: '/health',
      healthCheckInterval: '10s',
      healthCheckTimeout: '5s',
    }),
    PrometheusModule.register(),
    HealthModule,
  ],
  controllers: [DownloadController],
  providers: [DownloadService],
})
export class AppModule {}
