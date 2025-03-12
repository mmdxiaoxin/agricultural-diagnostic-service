import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigEnum } from '@shared/enum/config.enum';

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(entities = []): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService): TypeOrmModuleOptions =>
            ({
              type: configService.get(ConfigEnum.DB_TYPE),
              host: configService.get(ConfigEnum.DB_HOST),
              port: configService.get<number>(ConfigEnum.DB_PORT),
              username: configService.get(ConfigEnum.DB_USERNAME),
              password: configService.get(ConfigEnum.DB_PASSWORD),
              database: configService.get(ConfigEnum.DB_DATABASE),
              autoLoadEntities: true, // 自动加载实体
              synchronize: configService.get<boolean>(ConfigEnum.DB_SYNC),
              logging: process.env.NODE_ENV === 'development',
            }) as TypeOrmModuleOptions,
        }),
      ],
      exports: [TypeOrmModule],
    };
  }

  static forFeature(entities = []): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [TypeOrmModule.forFeature(entities)],
      exports: [TypeOrmModule],
    };
  }
}
