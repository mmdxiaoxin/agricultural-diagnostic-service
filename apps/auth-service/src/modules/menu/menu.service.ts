import { Menu } from '@app/database/entities/menu.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) {}

  async findAuthRoutes(roles: string[]) {
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
    menus.sort((a, b) => a.sort - b.sort); // 升序排序，如果是降序则改为 b.sort - a.sort

    // 构建菜单树
    const buildMenuTree = (parentId: number | null): any[] => {
      return menus
        .filter((menu) => menu.parentId === parentId)
        .sort((a, b) => a.sort - b.sort) // 对每一层级的菜单进行排序
        .map((menu) => ({
          icon: menu.icon,
          title: menu.title,
          path: menu.path,
          isLink: menu.isLink,
          children: buildMenuTree(menu.id), // 递归构建子菜单
        }));
    };

    // 返回顶层菜单
    return buildMenuTree(null);
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

  // 创建新菜单
  async create(menuData: Partial<Menu>): Promise<Menu> {
    const menu = this.menuRepository.create(menuData);
    return this.menuRepository.save(menu);
  }

  // 更新菜单
  async update(id: number, menuData: Partial<Menu>) {
    await this.menuRepository.update(id, menuData);
    return this.findOne(id);
  }

  // 删除菜单
  async remove(id: number): Promise<void> {
    await this.menuRepository.delete(id);
  }
}
