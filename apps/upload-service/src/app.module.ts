import { DatabaseModule } from '@app/database';
import { ConsulModule } from '@app/consul';
import { Dataset, FileEntity } from '@app/database/entities';
import { RedisModule } from '@app/redis';
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { UploadController } from './app.controller';
import { UploadService } from './app.service';
import { HealthModule } from './health/health.module';
import {
  UPLOAD_SERVICE_NAME,
  UPLOAD_SERVICE_HTTP_PORT,
} from 'config/microservice.config';

@Module({
  imports: [
    DatabaseModule.register(),
    DatabaseModule.forFeature([FileEntity, Dataset]),
    ConsulModule.register({
      serviceName: UPLOAD_SERVICE_NAME,
      servicePort: UPLOAD_SERVICE_HTTP_PORT,
      healthCheckPath: '/health',
      healthCheckInterval: '10s',
      healthCheckTimeout: '5s',
    }),
    RedisModule,
    PrometheusModule.register(),
    HealthModule,
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class AppModule {}
