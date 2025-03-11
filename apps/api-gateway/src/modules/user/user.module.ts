import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  USER_SERVICE_NAME,
  USER_SERVICE_PORT,
} from 'config/microservice.config';
import { Role } from '../role/role.entity';
import { Profile } from './models/profile.entity';
import { User } from './models/user.entity';
import { UserController } from './user.controller';

/**
 * 用户模块
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Profile]),
    ClientsModule.register([
      {
        name: USER_SERVICE_NAME,
        transport: Transport.TCP,
        options: { host: 'localhost', port: USER_SERVICE_PORT },
      },
    ]),
  ],
  controllers: [UserController],
})
export class UserModule {}
