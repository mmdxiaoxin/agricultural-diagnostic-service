import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  AUTH_SERVICE_HOST,
  AUTH_SERVICE_NAME,
  AUTH_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: AUTH_SERVICE_NAME,
        transport: Transport.TCP,
        options: { host: AUTH_SERVICE_HOST, port: AUTH_SERVICE_TCP_PORT },
      },
    ]),
  ],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
