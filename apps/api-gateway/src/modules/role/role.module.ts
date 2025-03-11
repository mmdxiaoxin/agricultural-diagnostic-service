import { Module } from '@nestjs/common';
import { RoleController } from './role.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  USER_SERVICE_NAME,
  USER_SERVICE_PORT,
} from 'config/microservice.config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: USER_SERVICE_NAME,
        transport: Transport.TCP,
        options: { host: 'localhost', port: USER_SERVICE_PORT },
      },
    ]),
  ],
  controllers: [RoleController],
})
export class RoleModule {}
