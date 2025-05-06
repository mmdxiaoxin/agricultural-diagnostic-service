import { Menu } from '@app/database/entities/menu.entity';
import { RedisService } from '@app/redis';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

@Injectable()
export class MenuService {
  private readonly CACHE_PREFIX = 'menu:routes:';
  private readonly CACHE_TTL = 3600; // 缓存1小时

  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    private readonly redisService: RedisService,
  ) {}

  async findAuthRoutes(roles: string[]) {
    // 生成缓存key
    const cacheKey = this.CACHE_PREFIX + roles.sort().join(':');

    // 尝试从缓存获取
    const cachedRoutes = await this.redisService.get<any[]>(cacheKey);
    if (cachedRoutes) {
      return cachedRoutes;
    }

    // 缓存未命中，从数据库获取
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

    // 存入缓存
    await this.redisService.set(cacheKey, menuTree, this.CACHE_TTL);

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
    const keys = await this.redisService
      .getClient()
      .keys(`${this.CACHE_PREFIX}*`);
    if (keys.length > 0) {
      await this.redisService.getClient().del(...keys);
    }
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
