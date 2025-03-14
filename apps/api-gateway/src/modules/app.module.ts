import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigEnum } from '@shared/enum/config.enum';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import {
  FILE_SERVICE_NAME,
  FILE_SERVICE_TCP_PORT,
} from 'config/microservice.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatasetModule } from './dataset/dataset.module';
import { DiagnosisModule } from './diagnosis/diagnosis.module';
import { FileModule } from './file/file.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { MenuModule } from './menu/menu.module';
import { PlantModule } from './plant/plant.module';
import { RoleModule } from './role/role.module';
import { UserModule } from './user/user.module';

/**
 * 根模块
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env',
        `.env.${process.env.NODE_ENV || 'development'}.local`,
      ],
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
          autoLoadEntities: true, // 自动加载实体
          synchronize: configService.get(ConfigEnum.DB_SYNC),
          logging: process.env.NODE_ENV === 'development',
        }) as TypeOrmModuleOptions,
    }),
    ClientsModule.register([
      {
        name: FILE_SERVICE_NAME,
        transport: Transport.TCP,
        options: { host: 'localhost', port: FILE_SERVICE_TCP_PORT },
      },
    ]),
    AuthModule,
    UserModule,
    RoleModule,
    FileModule,
    DatasetModule,
    MenuModule,
    KnowledgeModule,
    DiagnosisModule,
    PlantModule,
    PrometheusModule.register(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
