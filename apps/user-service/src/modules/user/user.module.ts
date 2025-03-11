import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../role/role.entity';
import { Profile } from './models/profile.entity';
import { User } from './models/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

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
