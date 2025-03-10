import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AUTH_SERVICE_PORT } from 'config/microservice.config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        port: AUTH_SERVICE_PORT,
      },
    },
  );
  await app.listen();
}
bootstrap();
