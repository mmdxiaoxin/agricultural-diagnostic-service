import { Menu } from '@app/database/entities/menu.entity';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MenuService } from './menu.service';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // 获取个人路由权限
  @MessagePattern({ cmd: 'menu.getRoutes' })
  async getRoutes(@Payload() data: { userId: number }) {
    return this.menuService.findAuthRoutes(data.userId);
  }

  // 获取所有菜单
  @MessagePattern({ cmd: 'menu.findAll' })
  async findAll() {
    return this.menuService.findAll();
  }

  // 获取单个菜单
  @MessagePattern({ cmd: 'menu.findOne' })
  async findOne(@Payload() data: { id: number }) {
    return this.menuService.findOne(data.id);
  }

  // 创建新菜单
  @MessagePattern({ cmd: 'menu.create' })
  async create(@Payload() data: { menuData: Partial<Menu> }) {
    return this.menuService.create(data.menuData);
  }

  // 更新菜单
  @MessagePattern({ cmd: 'menu.update' })
  async update(@Payload() data: { menuData: Partial<Menu> & { id: number } }) {
    return this.menuService.update(data.menuData.id, data.menuData);
  }

  // 删除菜单
  @MessagePattern({ cmd: 'menu.remove' })
  async remove(@Payload() data: { id: number }) {
    return this.menuService.remove(data.id);
  }
}
