import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  USER_SERVICE_NAME,
  USER_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { RoleController } from './role.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: USER_SERVICE_NAME,
        transport: Transport.TCP,
        options: { host: 'localhost', port: USER_SERVICE_TCP_PORT },
      },
    ]),
  ],
  controllers: [RoleController],
})
export class RoleModule {}
