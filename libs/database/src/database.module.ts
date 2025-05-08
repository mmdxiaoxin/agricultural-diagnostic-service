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
              // 连接池配置
              extra: {
                // 连接池最大连接数 - 根据内存大小增加
                connectionLimit: 100,
                // 连接超时时间（毫秒）
                connectTimeout: 10000,
                // 获取连接超时时间（毫秒）
                acquireTimeout: 10000,
                // 空闲连接超时时间（毫秒）
                idleTimeout: 300000, // 5分钟
                // 最大空闲连接数 - 增加以利用更多内存
                maxIdle: 50,
                // 最小空闲连接数 - 增加以保持更多活跃连接
                minIdle: 20,
                // 连接最大存活时间（毫秒）
                maxLifetime: 7200000, // 2小时
                // 是否启用连接池
                enablePool: true,
                // 连接池名称 - 使用应用名称和环境标识
                poolName: `agricultural-diagnostic-${process.env.NODE_ENV || 'development'}`,
                // 是否在连接池中启用队列
                queueLimit: 1000, // 增加队列限制
                // 是否在连接池中启用等待
                waitForConnections: true,
                // 连接池统计信息
                enableStatistics: true,
                // 连接池监控
                enableMonitor: true,
                // 连接池预热
                enableWarmup: true,
                // 连接池预热超时（毫秒）
                warmupTimeout: 30000,
                // 连接池预热间隔（毫秒）
                warmupInterval: 60000,
              },
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
            }) as TypeOrmModuleOptions,
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
