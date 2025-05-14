import { DatabaseModule } from '@app/database';
import { ConsulModule } from '@app/consul';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { MenuModule } from './modules/menu/menu.module';
import {
  AUTH_SERVICE_NAME,
  AUTH_SERVICE_HTTP_PORT,
} from 'config/microservice.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule.register(),
    ConsulModule.register({
      serviceName: AUTH_SERVICE_NAME,
      servicePort: AUTH_SERVICE_HTTP_PORT,
      healthCheckPath: '/health',
      healthCheckInterval: '30s',
      healthCheckTimeout: '5s',
    }),
    AuthModule,
    MenuModule,
    PrometheusModule.register(),
    HealthModule,
  ],
})
export class AppModule {}
