import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { ConfigEnum } from '@shared/enum/config.enum';
import {
  Crop,
  Dataset,
  DiagnosisFeedback,
  DiagnosisHistory,
  DiagnosisLog,
  DiagnosisRule,
  DiagnosisSupport,
  Disease,
  EnvironmentFactor,
  FileEntity,
  Menu,
  Profile,
  RemoteConfig,
  RemoteInterface,
  RemoteService,
  Role,
  Symptom,
  Treatment,
  User,
} from './entities';

@Global()
@Module({})
export class DatabaseModule {
  static register(entities: EntityClassOrSchema[] = []): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [
            ConfigModule.forRoot({
              isGlobal: true,
              envFilePath: [
                '.env',
                `.env.${process.env.NODE_ENV || 'development'}.local`,
              ],
            }),
          ],
          inject: [ConfigService],
          useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
            type: 'mysql',
            host: configService.get(ConfigEnum.DB_HOST),
            port: configService.get<number>(ConfigEnum.DB_PORT),
            username: configService.get(ConfigEnum.DB_USERNAME),
            password: configService.get<string>(ConfigEnum.DB_PASSWORD),
            database: configService.get(ConfigEnum.DB_DATABASE),
            autoLoadEntities: true, // 自动加载实体
            synchronize: configService.get<boolean>(ConfigEnum.DB_SYNC),
            logging: process.env.NODE_ENV === 'development',
            entities: [
              Crop,
              Dataset,
              DiagnosisFeedback,
              DiagnosisHistory,
              DiagnosisLog,
              DiagnosisRule,
              DiagnosisSupport,
              Disease,
              EnvironmentFactor,
              FileEntity,
              Menu,
              Profile,
              RemoteConfig,
              RemoteInterface,
              RemoteService,
              Role,
              Symptom,
              Treatment,
              User,
              ...entities,
            ],
          }),
        }),
      ],
      exports: [TypeOrmModule],
    };
  }

  static forFeature(entities: EntityClassOrSchema[] = []): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [TypeOrmModule.forFeature(entities)],
      exports: [TypeOrmModule],
    };
  }
}
