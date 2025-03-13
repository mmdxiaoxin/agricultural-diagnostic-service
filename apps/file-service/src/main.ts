import { CustomRpcExceptionFilter } from '@common/filters/rpc-exception.filter';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { FILE_SERVICE_PORT } from 'config/microservice.config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      port: FILE_SERVICE_PORT,
    },
  });
  microservice.useGlobalFilters(new CustomRpcExceptionFilter());
  await app.startAllMicroservices();
  await app.listen(FILE_SERVICE_PORT);
}
bootstrap();
