import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  AUTH_SERVICE_NAME,
  AUTH_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { MenuController } from './menu.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: AUTH_SERVICE_NAME,
        transport: Transport.TCP,
        options: { host: 'localhost', port: AUTH_SERVICE_TCP_PORT },
      },
    ]),
  ],
  controllers: [MenuController],
})
export class MenuModule {}
