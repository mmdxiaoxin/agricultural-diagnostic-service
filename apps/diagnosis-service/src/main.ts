import { CustomRpcExceptionFilter } from '@common/filters/rpc-exception.filter';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  DIAGNOSIS_SERVICE_HOST,
  DIAGNOSIS_SERVICE_HTTP_PORT,
  DIAGNOSIS_SERVICE_TCP_PORT,
} from 'config/microservice.config';

import { OtherExceptionsFilter } from '@common/filters/other-exception.filter';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: DIAGNOSIS_SERVICE_HOST,
      port: DIAGNOSIS_SERVICE_TCP_PORT,
    },
  });
  microservice.useGlobalFilters(
    new OtherExceptionsFilter(),
    new CustomRpcExceptionFilter(),
  );
  await app.listen(DIAGNOSIS_SERVICE_HTTP_PORT);
}
bootstrap();
