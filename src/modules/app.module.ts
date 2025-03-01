import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigEnum } from 'src/common/enum/config.enum';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { RoleModule } from './role/role.module';
import { User } from './user/user.entity';
import { Role } from './role/role.entity';
import { FileModule } from './file/file.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        ({
          type: configService.get(ConfigEnum.DB_TYPE),
          host: configService.get(ConfigEnum.DB_HOST),
          port: configService.get(ConfigEnum.DB_PORT),
          username: configService.get(ConfigEnum.DB_USERNAME),
          password: configService.get(ConfigEnum.DB_PASSWORD),
          database: configService.get(ConfigEnum.DB_DATABASE),
          entities: [User, Role],
          synchronize: configService.get(ConfigEnum.DB_SYNC),
          logging: process.env.NODE_ENV === 'development',
        }) as TypeOrmModuleOptions,
    }),
    AuthModule,
    UserModule,
    RoleModule,
    FileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
