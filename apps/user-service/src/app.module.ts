import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { RoleModule } from './modules/role/role.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [UserModule, RoleModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
