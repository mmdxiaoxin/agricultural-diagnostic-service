import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from './menu.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) {}

  // 获取个人路由权限
  async findAuthRoutes(roleId: number) {
    const menus = await this.menuRepository.find({
      relations: ['parent', 'children'],
      // where: {
      //   // TODO: 根据角色ID过滤菜单
      //   // 假设角色与菜单的关系表存在，这里根据 roleId 过滤相关菜单
      //   // 请根据实际表结构和关系来修改查询条件
      //   // roleId: roleId, // 角色ID
      // },
      order: { id: 'ASC' }, // 按照ID升序排列
    });

    // 构建菜单树
    const buildMenuTree = (parentId: number | null): any[] => {
      return menus
        .filter((menu) => menu.parentId === parentId)
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
