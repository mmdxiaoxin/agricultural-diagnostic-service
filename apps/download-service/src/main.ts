import { CustomRpcExceptionFilter } from '@common/filters/rpc-exception.filter';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  DOWNLOAD_SERVICE_HTTP_PORT,
  DOWNLOAD_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { AppModule } from './app.module';
import { OtherExceptionsFilter } from '@common/filters/other-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      port: DOWNLOAD_SERVICE_TCP_PORT,
    },
  });
  microservice.useGlobalFilters(
    new OtherExceptionsFilter(),
    new CustomRpcExceptionFilter(),
  );
  await app.startAllMicroservices();
  await app.listen(DOWNLOAD_SERVICE_HTTP_PORT);
}
bootstrap();
