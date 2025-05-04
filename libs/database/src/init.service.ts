import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from './entities/menu.entity';
import { Role } from './entities/role.entity';
import * as menuData from './config/menu.json';
import * as roleData from './config/role.json';
import * as rolesMenusData from './config/roles_menus.json';

@Injectable()
export class InitService implements OnModuleInit {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    await this.initMenus();
    await this.initRoles();
    await this.initRolesMenus();
  }

  private async initMenus() {
    const existingMenus = await this.menuRepository.find();
    if (existingMenus.length === 0) {
      const menus = menuData.map((menu) => ({
        ...menu,
        parentId: menu.parentId === null ? undefined : menu.parentId,
        isLink: menu.isLink === null ? undefined : menu.isLink,
        children: [],
        roles: [],
      }));
      await this.menuRepository.save(menus);
      console.log('菜单初始化完成');
    }
  }

  private async initRoles() {
    const existingRoles = await this.roleRepository.find();
    if (existingRoles.length === 0) {
      const roles = roleData.map((role) => ({
        ...role,
        users: [],
        menus: [],
      }));
      await this.roleRepository.save(roles);
      console.log('角色初始化完成');
    }
  }

  private async initRolesMenus() {
    const menus = await this.menuRepository.find();
    const roles = await this.roleRepository.find();

    if (menus.length > 0 && roles.length > 0) {
      for (const roleMenu of rolesMenusData) {
        const role = roles.find((r) => r.id === roleMenu.role_id);
        const menu = menus.find((m) => m.id === roleMenu.menu_id);

        if (role && menu) {
          if (!role.menus) {
            role.menus = [];
          }
          if (!menu.roles) {
            menu.roles = [];
          }

          role.menus.push(menu);
          menu.roles.push(role);

          await this.roleRepository.save(role);
          await this.menuRepository.save(menu);
        }
      }
      console.log('角色菜单关联初始化完成');
    }
  }
}
