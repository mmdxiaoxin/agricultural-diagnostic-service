import { Menu } from '@app/database/entities/menu.entity';
import { RedisService } from '@app/redis';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { formatResponse } from '@shared/helpers/response.helper';
import { Repository } from 'typeorm';

@Injectable()
export class MenuService {
  private readonly CACHE_PREFIX = 'menu:routes:';
  private readonly CACHE_TTL = 3600; // 缓存1小时
  private readonly logger = new Logger(MenuService.name);

  // 内存缓存
  private readonly memoryCache = new Map<
    string,
    {
      data: any;
      timestamp: number;
    }
  >();
  private readonly MEMORY_CACHE_TTL = 300000; // 5分钟
  private readonly MAX_MEMORY_CACHE_SIZE = 1000;

  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    private readonly redisService: RedisService,
  ) {}

  async findAuthRoutes(roles: string[]) {
    // 生成缓存key
    const cacheKey = this.CACHE_PREFIX + roles.sort().join(':');

    try {
      // 1. 尝试从内存缓存获取
      const memoryCached = this.getFromMemoryCache(cacheKey);
      if (memoryCached) {
        return formatResponse(
          200,
          memoryCached,
          '获取个人路由权限成功(内存缓存)',
        );
      }

      // 2. 尝试从Redis缓存获取
      const cachedRoutes = await this.redisService.get<any[]>(cacheKey);
      if (cachedRoutes) {
        // 更新内存缓存
        this.updateMemoryCache(cacheKey, cachedRoutes);
        return formatResponse(
          200,
          cachedRoutes,
          '获取个人路由权限成功(Redis缓存)',
        );
      }
    } catch (error) {
      this.logger.warn(`从缓存获取菜单路由失败: ${error.message}`);
      // 缓存错误不影响主流程，继续从数据库获取
    }

    // 3. 从数据库获取
    try {
      const menus = await this.menuRepository
        .createQueryBuilder('menu')
        .leftJoinAndSelect('menu.roles', 'role')
        .select([
          'menu.id',
          'menu.parentId',
          'menu.icon',
          'menu.title',
          'menu.path',
          'menu.isLink',
          'menu.sort',
          'role.name',
        ])
        .where('role.name IN (:...roles)', { roles })
        .orderBy('menu.sort', 'ASC')
        .cache(true) // 启用TypeORM查询缓存
        .getMany();

      // 构建菜单树
      const menuTree = this.buildMenuTree(menus);

      // 4. 更新缓存
      await this.updateCaches(cacheKey, menuTree);

      return formatResponse(200, menuTree, '获取个人路由权限成功');
    } catch (error) {
      this.logger.error(`获取菜单路由失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 从内存缓存获取数据
  private getFromMemoryCache(key: string): any | null {
    const cached = this.memoryCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.MEMORY_CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  // 更新内存缓存
  private updateMemoryCache(key: string, data: any) {
    // 如果缓存已满，删除最旧的项
    if (this.memoryCache.size >= this.MAX_MEMORY_CACHE_SIZE) {
      const oldestKey = Array.from(this.memoryCache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp,
      )[0][0];
      this.memoryCache.delete(oldestKey);
    }

    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  // 更新所有缓存
  private async updateCaches(key: string, data: any) {
    // 更新内存缓存
    this.updateMemoryCache(key, data);

    // 更新Redis缓存
    try {
      await this.redisService.set(key, data, this.CACHE_TTL);
    } catch (error) {
      this.logger.warn(`更新Redis缓存失败: ${error.message}`);
    }
  }

  // 构建菜单树
  private buildMenuTree(menus: Menu[]): any[] {
    const menuMap = new Map<number, any>();
    const result: any[] = [];

    // 首先创建所有菜单节点
    menus.forEach((menu) => {
      menuMap.set(menu.id, {
        icon: menu.icon,
        title: menu.title,
        path: menu.path,
        isLink: menu.isLink,
        children: [],
      });
    });

    // 构建树形结构
    menus.forEach((menu) => {
      const node = menuMap.get(menu.id);
      if (!menu.parentId) {
        result.push(node);
      } else {
        const parent = menuMap.get(menu.parentId);
        if (parent) {
          parent.children.push(node);
        }
      }
    });

    return result;
  }

  // 获取所有菜单
  async findAll() {
    const list = await this.menuRepository.find();
    return formatResponse(200, list, '获取所有菜单成功');
  }

  // 根据ID获取单个菜单
  async findOne(id: number) {
    const menu = await this.menuRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
    return formatResponse(200, menu, '获取单个菜单成功');
  }

  // 清除所有菜单相关的缓存
  private async clearMenuCache() {
    try {
      const keys = await this.redisService
        .getClient()
        .keys(`${this.CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await this.redisService.getClient().del(...keys);
      }
    } catch (error) {
      this.logger.error(`清除菜单缓存失败: ${error.message}`);
      // 缓存清除失败不影响主流程
    }
  }

  // 创建新菜单
  async create(menuData: Partial<Menu>) {
    const menu = this.menuRepository.create(menuData);
    const result = await this.menuRepository.save(menu);
    // 清除缓存
    await this.clearMenuCache().catch((error) => {
      this.logger.warn(`创建菜单后清除缓存失败: ${error.message}`);
    });
    return formatResponse(201, result, '创建菜单成功');
  }

  // 更新菜单
  async update(id: number, menuData: Partial<Menu>) {
    await this.menuRepository.update(id, menuData);
    // 清除缓存
    await this.clearMenuCache().catch((error) => {
      this.logger.warn(`更新菜单后清除缓存失败: ${error.message}`);
    });
    return formatResponse(200, {}, '更新菜单成功');
  }

  // 删除菜单
  async remove(id: number) {
    await this.menuRepository.delete(id);
    // 清除缓存
    await this.clearMenuCache().catch((error) => {
      this.logger.warn(`删除菜单后清除缓存失败: ${error.message}`);
    });
    return formatResponse(204, {}, '删除菜单成功');
  }
}
