import { CustomRpcExceptionFilter } from '@common/filters/rpc-exception.filter';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DIAGNOSIS_SERVICE_TCP_PORT } from 'config/microservice.config';

import { OtherExceptionsFilter } from '@common/filters/other-exception.filter';
import { AppModule } from './app.module';

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
