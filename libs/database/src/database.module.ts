import { DynamicModule, Global, Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { ConfigEnum } from '@shared/enum/config.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    await this.initializeBasicRoles();
    this.logger.log('数据库初始化完成，基础角色检查完毕');
  }

  private async initializeBasicRoles() {
    for (const roleData of Role.BASIC_ROLES) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!existingRole) {
        const role = this.roleRepository.create(roleData);
        await this.roleRepository.save(role);
        this.logger.log(`创建基础角色: ${roleData.name} (${roleData.alias})`);
      }
    }
  }

  static register(entities: EntityClassOrSchema[] = []): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          imports: [
            ConfigModule.forRoot({
              isGlobal: true,
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
        TypeOrmModule.forFeature([Role]),
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
