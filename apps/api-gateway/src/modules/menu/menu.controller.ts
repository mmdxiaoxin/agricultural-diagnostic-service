import {
  ApiErrorResponse,
  ApiNullResponse,
  ApiResponse,
} from '@common/decorator/api-response.decorator';
import { Roles } from '@common/decorator/roles.decorator';
import {
  RolesConfigDto,
  MenusConfigDto,
} from '@common/dto/menu/menu-config.dto';
import { RouteItemDto } from '@common/dto/menu/route.dto';
import { AuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@shared/enum/role.enum';
import { Request } from 'express';
import { MenuService } from './menu.service';

@ApiTags('菜单管理')
@UseGuards(AuthGuard)
@Controller('menu')
@ApiBearerAuth()
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('routes')
  @ApiOperation({
    summary: '获取个人路由权限',
    description: '获取当前登录用户的路由权限列表',
  })
  @ApiResponse(HttpStatus.OK, '获取成功', RouteItemDto, true)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  async getRoutes(@Req() req: Request) {
    return this.menuService.getRoutes(req.user.roles);
  }

  @Get()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '获取所有菜单',
    description: '获取系统中所有的菜单列表（仅管理员可访问）',
  })
  @ApiResponse(HttpStatus.OK, '获取成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  async findAll() {
    return this.menuService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '获取单个菜单',
    description: '获取指定菜单的详细信息（仅管理员可访问）',
  })
  @ApiParam({ name: 'id', description: '菜单ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '获取成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '菜单不存在')
  async findOne(@Param('id') id: number) {
    return this.menuService.findOne(id);
  }

  @Post()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '创建新菜单',
    description: '创建新的菜单项（仅管理员可访问）',
  })
  @ApiResponse(HttpStatus.CREATED, '创建成功')
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  async create(@Body() menuData: any) {
    return this.menuService.create(menuData);
  }

  @Put(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: '更新菜单',
    description: '更新指定菜单的信息（仅管理员可访问）',
  })
  @ApiParam({ name: 'id', description: '菜单ID', type: 'number' })
  @ApiResponse(HttpStatus.OK, '更新成功')
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '菜单不存在')
  async update(@Param('id') id: number, @Body() menuData: any) {
    return this.menuService.update(id, menuData);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '删除菜单',
    description: '删除指定的菜单（仅管理员可访问）',
  })
  @ApiParam({ name: 'id', description: '菜单ID', type: 'number' })
  @ApiNullResponse(HttpStatus.NO_CONTENT, '删除成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, '权限不足')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, '菜单不存在')
  async remove(@Param('id') id: number) {
    return this.menuService.remove(id);
  }

  @Post('configure-roles')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '配置菜单角色关联',
    description: '为指定菜单配置角色权限',
  })
  @ApiResponse(HttpStatus.OK, '配置成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiBearerAuth()
  async configureMenuRoles(@Body() data: RolesConfigDto) {
    return this.menuService.configureMenuRoles(data);
  }

  @Post('configure-menus')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '配置菜单角色关联',
    description: '为指定菜单配置角色权限',
  })
  @ApiResponse(HttpStatus.OK, '配置成功')
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  @ApiBearerAuth()
  async configureMenuMenus(@Body() data: MenusConfigDto) {
    return this.menuService.configureMenuMenus(data);
  }
}
