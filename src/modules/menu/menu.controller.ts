import { AuthGuard } from '@/common/guards/auth.guard';
import { formatResponse } from '@/common/helpers/response.helper';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { Menu } from './menu.entity';
import { MenuService } from './menu.service';
import { Roles } from '@/common/decorator/roles.decorator';
import { Role } from '@/common/enum/role.enum';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TypeormFilter } from '@/common/filters/typeorm.filter';

@Controller('menu')
@UseGuards(AuthGuard)
@UseFilters(TypeormFilter)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // 获取个人路由权限
  @Get('routes')
  async getRoutes(@Req() req) {
    try {
      const user = req.user;
      const routes = await this.menuService.findAuthRoutes(user.id);
      return formatResponse(200, routes, 'Routes fetched successfully');
    } catch (error) {
      throw error;
    }
  }

  // 获取所有菜单
  @Get()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async findAll() {
    try {
      const menus = await this.menuService.findAll();
      return formatResponse(200, menus, 'Menus fetched successfully');
    } catch (error) {
      throw error;
    }
  }

  // 获取单个菜单
  @Get(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async findOne(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    try {
      const menu = await this.menuService.findOne(id);
      if (!menu) {
        throw new NotFoundException('Menu not found');
      }
      return formatResponse(200, menu, 'Menu fetched successfully');
    } catch (error) {
      throw error;
    }
  }

  // 创建新菜单
  @Post()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() menuData: Partial<Menu>) {
    try {
      const newMenu = await this.menuService.create(menuData);
      return formatResponse(201, newMenu, 'Menu created successfully');
    } catch (error) {
      throw error;
    }
  }

  // 更新菜单
  @Put(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async update(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() menuData: Partial<Menu>,
  ) {
    try {
      const updatedMenu = await this.menuService.update(id, menuData);
      if (!updatedMenu) {
        throw new NotFoundException('Menu not found');
      }
      return formatResponse(200, updatedMenu, 'Menu updated successfully');
    } catch (error) {
      throw error;
    }
  }

  // 删除菜单
  @Delete(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async remove(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    try {
      await this.menuService.remove(id);
      return formatResponse(200, null, 'Menu deleted successfully');
    } catch (error) {
      throw error;
    }
  }
}
