import { DatabaseModule } from '@app/database';
import { ConsulModule } from '@app/consul';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigEnum } from '@shared/enum/config.enum';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { DiagnosisModule } from './modules/diagnosis/diagnosis.module';
import { RemoteServiceModule } from './modules/remote/remote.module';
import { HealthModule } from './modules/health/health.module';
import {
  DIAGNOSIS_SERVICE_NAME,
  DIAGNOSIS_SERVICE_HTTP_PORT,
} from 'config/microservice.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule.register(),
    ConsulModule.register({
      serviceName: DIAGNOSIS_SERVICE_NAME,
      servicePort: DIAGNOSIS_SERVICE_HTTP_PORT,
      healthCheckPath: '/health',
      healthCheckInterval: '10s',
      healthCheckTimeout: '5s',
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get(ConfigEnum.REDIS_HOST),
          port: configService.get(ConfigEnum.REDIS_PORT),
          password: configService.get(ConfigEnum.REDIS_PASSWORD),
          db: configService.get(ConfigEnum.REDIS_DB),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      }),
      inject: [ConfigService],
    }),
    RemoteServiceModule,
    DiagnosisModule,
    PrometheusModule.register(),
    HealthModule,
  ],
})
export class AppModule {}
