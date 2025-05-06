import { Menu } from '@app/database/entities/menu.entity';
import { RedisService } from '@app/redis';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

@Injectable()
export class MenuService {
  private readonly CACHE_PREFIX = 'menu:routes:';
  private readonly CACHE_TTL = 3600; // 缓存1小时
  private readonly logger = new Logger(MenuService.name);
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1秒

  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    private readonly redisService: RedisService,
  ) {}

  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T | null> {
    let lastError: Error | null = null;

    for (let i = 0; i < this.MAX_RETRIES; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        const isConnectionError =
          error.message.includes('Connection closed') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ECONNRESET');

        if (isConnectionError && i < this.MAX_RETRIES - 1) {
          const delay = this.RETRY_DELAY * Math.pow(2, i);
          this.logger.warn(
            `${operationName} 失败，Redis 连接错误，${delay}ms 后重试: ${error.message}`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        this.logger.error(`${operationName} 失败: ${error.message}`);
        return null;
      }
    }

    this.logger.error(`${operationName} 最终失败: ${lastError?.message}`);
    return null;
  }

  async findAuthRoutes(roles: string[]) {
    // 生成缓存key
    const cacheKey = this.CACHE_PREFIX + roles.sort().join(':');

    // 尝试从缓存获取
    const cachedRoutes = await this.withRetry(
      () => this.redisService.get<any[]>(cacheKey),
      '从缓存获取菜单路由',
    );

    if (cachedRoutes) {
      return cachedRoutes;
    }

    // 缓存未命中或出错，从数据库获取
    const menus = await this.menuRepository.find({
      relations: ['parent', 'children', 'roles'],
      where: {
        roles: {
          name: In(roles),
        },
      },
      order: { id: 'ASC' },
    });

    // 按照 sort 属性对菜单进行排序
    menus.sort((a, b) => a.sort - b.sort);

    // 构建菜单树
    const buildMenuTree = (parentId: number | null): any[] => {
      return menus
        .filter((menu) => menu.parentId === parentId)
        .sort((a, b) => a.sort - b.sort)
        .map((menu) => ({
          icon: menu.icon,
          title: menu.title,
          path: menu.path,
          isLink: menu.isLink,
          children: buildMenuTree(menu.id),
        }));
    };

    // 生成菜单树
    const menuTree = buildMenuTree(null);

    // 尝试存入缓存
    await this.withRetry(
      () => this.redisService.set(cacheKey, menuTree, this.CACHE_TTL),
      '缓存菜单路由',
    );

    return menuTree;
  }

  // 获取所有菜单
  async findAll(): Promise<Menu[]> {
    return this.menuRepository.find({
      relations: ['parent', 'children'],
    });
  }

  // 根据ID获取单个菜单
  async findOne(id: number): Promise<Menu | null> {
    return this.menuRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
  }

  // 清除所有菜单相关的缓存
  private async clearMenuCache() {
    await this.withRetry(async () => {
      const keys = await this.redisService
        .getClient()
        .keys(`${this.CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await this.redisService.getClient().del(...keys);
      }
    }, '清除菜单缓存');
  }

  // 创建新菜单
  async create(menuData: Partial<Menu>): Promise<Menu> {
    const menu = this.menuRepository.create(menuData);
    const result = await this.menuRepository.save(menu);
    // 清除缓存
    await this.clearMenuCache();
    return result;
  }

  // 更新菜单
  async update(id: number, menuData: Partial<Menu>) {
    await this.menuRepository.update(id, menuData);
    // 清除缓存
    await this.clearMenuCache();
    return this.findOne(id);
  }

  // 删除菜单
  async remove(id: number): Promise<void> {
    await this.menuRepository.delete(id);
    // 清除缓存
    await this.clearMenuCache();
  }
}
