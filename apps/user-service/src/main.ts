import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { USER_SERVICE_PORT } from 'config/microservice.config';
import { UserServiceModule } from './user-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserServiceModule,
    {
      transport: Transport.TCP,
      options: {
        port: USER_SERVICE_PORT,
      },
    },
  );
  await app.listen();
}
bootstrap();
