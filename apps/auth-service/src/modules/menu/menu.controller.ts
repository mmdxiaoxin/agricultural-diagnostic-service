import { Menu } from '@app/database/entities/menu.entity';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MenuService } from './menu.service';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // TCP endpoints
  @MessagePattern({ cmd: 'menu.get.routes' })
  async getRoutes(@Payload() data: { roles: string[] }) {
    return this.menuService.findAuthRoutes(data.roles);
  }

  @MessagePattern({ cmd: 'menu.get.role.by.id' })
  async getRoleById(@Payload() data: { roleId: number }) {
    return this.menuService.getRoleMenuById(data.roleId);
  }

  @MessagePattern({ cmd: 'menu.get' })
  async findAll() {
    return this.menuService.findAll();
  }

  @MessagePattern({ cmd: 'menu.get.byId' })
  async findOne(@Payload() data: { id: number }) {
    return this.menuService.findOne(data.id);
  }

  @MessagePattern({ cmd: 'menu.create' })
  async create(@Payload() data: { menuData: Partial<Menu> }) {
    return this.menuService.create(data.menuData);
  }

  @MessagePattern({ cmd: 'menu.update' })
  async update(@Payload() data: { menuData: Partial<Menu> & { id: number } }) {
    return this.menuService.update(data.menuData.id, data.menuData);
  }

  @MessagePattern({ cmd: 'menu.remove' })
  async remove(@Payload() data: { id: number }) {
    return this.menuService.remove(data.id);
  }

  @MessagePattern({ cmd: 'menu.configure.roles' })
  async configureRoles(@Payload() data: { menuId: number; roleIds: number[] }) {
    return this.menuService.configureRoles(data.menuId, data.roleIds);
  }

  @MessagePattern({ cmd: 'menu.configure.menus' })
  async configureMenus(@Payload() data: { menuIds: number[]; roleId: number }) {
    return this.menuService.configureMenus(data.menuIds, data.roleId);
  }
}
