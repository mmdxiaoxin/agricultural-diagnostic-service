import { TypeormFilter } from '@common/filters/typeorm.filter';
import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Menu } from './menu.entity';
import { MenuService } from './menu.service';

@Controller('menu')
@UseFilters(TypeormFilter)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // 获取个人路由权限
  @MessagePattern('menu_getRoutes')
  async getRoutes(@Payload() userId: number) {
    return this.menuService.findAuthRoutes(userId);
  }

  // 获取所有菜单
  @MessagePattern('menu_findAll')
  async findAll() {
    return this.menuService.findAll();
  }

  // 获取单个菜单
  @MessagePattern('menu_findOne')
  async findOne(@Payload() id: number) {
    return await this.menuService.findOne(id);
  }

  // 创建新菜单
  @MessagePattern('menu_create')
  async create(@Payload() menuData: Partial<Menu>) {
    return this.menuService.create(menuData);
  }

  // 更新菜单
  @MessagePattern('menu_update')
  async update(@Payload() menuData: Partial<Menu> & { id: number }) {
    return this.menuService.update(menuData.id, menuData);
  }

  // 删除菜单
  @MessagePattern('menu_remove')
  async remove(@Payload() id: number) {
    return await this.menuService.remove(id);
  }
}
