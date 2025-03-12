import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { Profile, Role, User } from '@app/database/entities';

/**
 * 用户模块
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Profile])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
