import {
  DynamicModule,
  Global,
  Logger,
  Module,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  InjectRepository,
  TypeOrmModule,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { ConfigEnum } from '@shared/enum/config.enum';
import { In, Repository } from 'typeorm';
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
import { menusData } from './data/menus';

@Global()
@Module({})
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) {}

  async onModuleInit() {
    await this.initializeBasicRoles();
    await this.initializeMenus();
    this.logger.log('数据库初始化完成，基础角色和菜单检查完毕');
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

  private async initializeMenus() {
    // 首先检查是否需要初始化
    const existingMenuCount = await this.menuRepository.count();
    if (existingMenuCount > 0) {
      this.logger.log('菜单已存在，跳过初始化');
      return;
    }

    // 按照依赖关系排序菜单数据（父菜单在前，子菜单在后）
    const sortedMenusData = this.sortMenusByDependency(menusData);

    // 创建ID映射：数据文件中的ID -> 数据库中的ID
    const idMapping = new Map<number, number>();
    const menuMap = new Map<string, Menu>();

    // 第一轮：创建所有菜单，不设置父子关系
    for (const menuData of sortedMenusData) {
      const menu = this.menuRepository.create({
        icon: menuData.icon,
        title: menuData.title,
        path: menuData.path,
        sort: menuData.sort || 0,
        isLink: menuData.isLink || undefined,
        parentId: undefined, // 先不设置父ID
      });
      const savedMenu = await this.menuRepository.save(menu);

      // 建立映射关系
      idMapping.set(menuData.id, savedMenu.id);
      menuMap.set(menuData.path, savedMenu);
      this.logger.log(`创建菜单: ${menuData.title} (ID: ${savedMenu.id})`);
    }

    // 第二轮：设置父子关系
    for (const menuData of sortedMenusData) {
      if (menuData.parentId) {
        const parentDbId = idMapping.get(menuData.parentId);
        const childMenu = menuMap.get(menuData.path);

        if (parentDbId && childMenu) {
          childMenu.parentId = parentDbId;
          await this.menuRepository.save(childMenu);
          this.logger.log(
            `设置父子关系: ${childMenu.title} -> 父菜单ID: ${parentDbId}`,
          );
        }
      }
    }

    // 第三轮：设置角色关系
    for (const menuData of sortedMenusData) {
      const menu = menuMap.get(menuData.path);
      if (menu && menuData.roles) {
        const roles = await this.roleRepository.find({
          where: { name: In(menuData.roles) },
        });
        menu.roles = roles;
        await this.menuRepository.save(menu);
        this.logger.log(
          `设置角色关系: ${menu.title} -> ${roles.map((r) => r.name).join(', ')}`,
        );
      }
    }

    this.logger.log('菜单初始化完成');
  }

  /**
   * 按照依赖关系排序菜单数据
   * 确保父菜单在子菜单之前创建
   */
  private sortMenusByDependency(
    menus: typeof menusData,
  ): (typeof menusData)[number][] {
    const menuMap = new Map<number, (typeof menusData)[number]>();
    const result: (typeof menusData)[number][] = [];
    const visited = new Set<number>();

    // 建立菜单映射
    menus.forEach((menu) => menuMap.set(menu.id, menu));

    // 深度优先遍历，确保父菜单在前
    const visit = (menuId: number) => {
      if (visited.has(menuId)) return;

      const menu = menuMap.get(menuId);
      if (!menu) return;

      // 先访问父菜单
      if (menu.parentId && !visited.has(menu.parentId)) {
        visit(menu.parentId);
      }

      visited.add(menuId);
      result.push(menu);
    };

    // 访问所有菜单
    menus.forEach((menu) => visit(menu.id));

    return result;
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
            autoLoadEntities: true,
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
        TypeOrmModule.forFeature([Role, Menu]),
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
