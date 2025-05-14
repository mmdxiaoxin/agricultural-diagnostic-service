import { DatabaseModule } from '@app/database';
import { ConsulModule } from '@app/consul';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { HealthModule } from './modules/health/health.module';
import { RoleModule } from './modules/role/role.module';
import { UserModule } from './modules/user/user.module';
import {
  USER_SERVICE_NAME,
  USER_SERVICE_HTTP_PORT,
} from 'config/microservice.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule.register(),
    ConsulModule.register({
      serviceName: USER_SERVICE_NAME,
      servicePort: USER_SERVICE_HTTP_PORT,
      healthCheckPath: '/health',
      healthCheckInterval: '10s',
      healthCheckTimeout: '5s',
    }),
    UserModule,
    RoleModule,
    PrometheusModule.register(),
    HealthModule,
  ],
})
export class AppModule {}
