import { MetricsService } from '@app/metrics';
import { startMetricsServer } from '@app/metrics/metrics.http';
import { CustomRpcExceptionFilter } from '@common/filters/rpc-exception.filter';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DIAGNOSIS_SERVICE_PORT } from 'config/microservice.config';
import { DIAGNOSIS_SERVICE_PROMETHEUS_PORT } from 'config/prometheus.config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        port: DIAGNOSIS_SERVICE_PORT,
      },
    },
  );

  const metricsService = app.get(MetricsService);
  startMetricsServer(metricsService, DIAGNOSIS_SERVICE_PROMETHEUS_PORT);

  app.useGlobalFilters(new CustomRpcExceptionFilter());
  await app.listen();
}
bootstrap();
