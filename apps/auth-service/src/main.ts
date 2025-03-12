import { MetricsService } from '@app/metrics';
import { startMetricsServer } from '@app/metrics/metrics.http';
import { CustomRpcExceptionFilter } from '@common/filters/rpc-exception.filter';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AUTH_SERVICE_PORT } from 'config/microservice.config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        port: AUTH_SERVICE_PORT,
      },
    },
  );

  const metricsService = app.get(MetricsService);
  startMetricsServer(metricsService, 9100);

  app.useGlobalFilters(new CustomRpcExceptionFilter());
  await app.listen();
}
bootstrap();
