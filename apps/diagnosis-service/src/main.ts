import { MetricsService } from '@app/metrics';
import { startMetricsServer } from '@app/metrics/metrics.http';
import { CustomRpcExceptionFilter } from '@common/filters/rpc-exception.filter';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  DIAGNOSIS_SERVICE_HTTP_PORT,
  DIAGNOSIS_SERVICE_TCP_PORT,
} from 'config/microservice.config';

import { AppModule } from './app.module';
import { OtherExceptionsFilter } from '@common/filters/other-exception.filter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        port: DIAGNOSIS_SERVICE_TCP_PORT,
      },
    },
  );
  app.useGlobalFilters(
    new OtherExceptionsFilter(),
    new CustomRpcExceptionFilter(),
  );
  await app.listen();
}
bootstrap();
