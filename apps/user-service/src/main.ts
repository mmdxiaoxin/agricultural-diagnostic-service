import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { USER_SERVICE_PORT } from 'config/microservice.config';
import { AppModule } from './app.module';
import { MetricsService } from '@app/metrics';
import { startMetricsServer } from '@app/metrics/metrics.http';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        port: USER_SERVICE_PORT,
      },
    },
  );

  const metricsService = app.get(MetricsService);
  startMetricsServer(metricsService, 9200);

  await app.listen();
}
bootstrap();
