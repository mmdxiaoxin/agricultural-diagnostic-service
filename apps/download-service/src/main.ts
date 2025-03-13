import { CustomRpcExceptionFilter } from '@common/filters/rpc-exception.filter';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  DOWNLOAD_SERVICE_HTTP_PORT,
  DOWNLOAD_SERVICE_RPC_PORT,
} from 'config/microservice.config';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'download',
      protoPath: join(__dirname, '/proto/download.proto'),
      url: `localhost:${DOWNLOAD_SERVICE_RPC_PORT}`,
    },
  });
  microservice.useGlobalFilters(new CustomRpcExceptionFilter());
  await app.startAllMicroservices();
  await app.listen(DOWNLOAD_SERVICE_HTTP_PORT);
}
bootstrap();
