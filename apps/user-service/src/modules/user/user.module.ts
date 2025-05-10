import { Profile, Role, User } from '@app/database/entities';
import { RedisModule } from '@app/redis';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserGrpcController } from './user.grpc.controller';
import { UserService } from './user.service';

/**
 * 用户模块
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, Profile, Role]), RedisModule],
  controllers: [UserController, UserGrpcController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
