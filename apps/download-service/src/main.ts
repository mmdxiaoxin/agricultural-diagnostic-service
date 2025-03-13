import { CustomRpcExceptionFilter } from '@common/filters/rpc-exception.filter';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DOWNLOAD_SERVICE_PORT } from 'config/microservice.config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      port: DOWNLOAD_SERVICE_PORT,
    },
  });
  app.useGlobalFilters(new CustomRpcExceptionFilter());
  await app.startAllMicroservices();
  await app.listen(DOWNLOAD_SERVICE_PORT);
}
bootstrap();
