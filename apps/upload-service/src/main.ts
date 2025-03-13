import { CustomRpcExceptionFilter } from '@common/filters/rpc-exception.filter';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { UPLOAD_SERVICE_PORT } from 'config/microservice.config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      port: UPLOAD_SERVICE_PORT,
    },
  });
  app.useGlobalFilters(new CustomRpcExceptionFilter());
  await app.startAllMicroservices();
  await app.listen(UPLOAD_SERVICE_PORT);
}
bootstrap();
