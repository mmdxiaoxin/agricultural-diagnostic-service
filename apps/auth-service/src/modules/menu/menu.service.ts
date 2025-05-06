import { Menu } from '@app/database/entities/menu.entity';
import { RedisService } from '@app/redis';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { formatResponse } from '@shared/helpers/response.helper';
import { In, Repository } from 'typeorm';

@Injectable()
export class MenuService {
  private readonly CACHE_PREFIX = 'menu:routes:';
  private readonly CACHE_TTL = 3600; // 缓存1小时
  private readonly logger = new Logger(MenuService.name);

  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    private readonly redisService: RedisService,
  ) {}

  async findAuthRoutes(roles: string[]) {
    // 生成缓存key
    const cacheKey = this.CACHE_PREFIX + roles.sort().join(':');

    try {
      // 尝试从缓存获取
      const cachedRoutes = await this.redisService.get<any[]>(cacheKey);
      if (cachedRoutes) {
        return formatResponse(200, cachedRoutes, '获取个人路由权限成功');
      }
    } catch (error) {
      this.logger.warn(`从缓存获取菜单路由失败: ${error.message}`);
      // 缓存错误不影响主流程，继续从数据库获取
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

    try {
      // 存入缓存
      await this.redisService.set(cacheKey, menuTree, this.CACHE_TTL);
    } catch (error) {
      this.logger.warn(`缓存菜单路由失败: ${error.message}`);
      // 缓存错误不影响主流程，继续返回数据
    }

    return formatResponse(200, menuTree, '获取个人路由权限成功');
  }

  // 获取所有菜单
  async findAll() {
    const list = await this.menuRepository.find({
      relations: ['parent', 'children'],
    });
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
