import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { AUTH_SERVICE_NAME } from 'config/microservice.config';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: AUTH_SERVICE_NAME,
        // 这里需要配置微服务连接选项
      },
    ]),
  ],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
