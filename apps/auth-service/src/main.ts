import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AUTH_SERVICE_PORT } from 'config/microservice.config';
import { AuthServiceModule } from './auth-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthServiceModule,
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
