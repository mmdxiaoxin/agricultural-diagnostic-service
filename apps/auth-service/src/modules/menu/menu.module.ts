import { Menu } from '@app/database/entities/menu.entity';
import { Profile } from '@app/database/entities/profile.entity';
import { Role } from '@app/database/entities/role.entity';
import { User } from '@app/database/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

@Module({
  imports: [TypeOrmModule.forFeature([Menu, Role, User, Profile])],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
