import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  USER_SERVICE_NAME,
  USER_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { UserController } from './user.controller';
import { UserService } from './user.service';

/**
 * 用户模块
 */
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
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
