import { Roles } from '@common/decorator/roles.decorator';
import { AuthGuard } from '@common/guards/auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@shared/enum/role.enum';
import { formatResponse } from '@shared/helpers/response.helper';
import { AUTH_SERVICE_NAME } from 'config/microservice.config';
import { Request } from 'express';
import { defaultIfEmpty, lastValueFrom } from 'rxjs';

@ApiTags('菜单管理')
@UseGuards(AuthGuard)
@Controller('menu')
export class MenuController {
  constructor(
    @Inject(AUTH_SERVICE_NAME) private readonly authClient: ClientProxy,
  ) {}

  // 获取个人路由权限
  @Get('routes')
  async getRoutes(@Req() req: Request) {
    const roles = req.user.roles;
    const routes = await lastValueFrom(
      this.authClient
        .send({ cmd: 'menu.get.routes' }, { roles })
        .pipe(defaultIfEmpty([])),
    );
    return formatResponse(200, routes, '获取个人路由权限成功');
  }

  // 获取所有菜单
  @Get()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async findAll() {
    const list = await lastValueFrom(
      this.authClient.send({ cmd: 'menu.get' }, {}).pipe(defaultIfEmpty([])),
    );
    return formatResponse(200, list, '获取所有菜单成功');
  }

  // 获取单个菜单
  @Get(':id(\\d+)')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async findOne(@Param('id') id: number) {
    const menu = await lastValueFrom(
      this.authClient
        .send({ cmd: 'menu.get.byId' }, { id })
        .pipe(defaultIfEmpty({})),
    );
    return formatResponse(200, menu, '获取单个菜单成功');
  }

  // 创建新菜单
  @Post()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() menuData: any) {
    await lastValueFrom(
      this.authClient
        .send({ cmd: 'menu.create' }, { menuData })
        .pipe(defaultIfEmpty({})),
    );
    return formatResponse(201, {}, '创建成功');
  }

  // 更新菜单
  @Put(':id(\\d+)')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  async update(@Param('id') id: number, @Body() menuData: any) {
    await lastValueFrom(
      this.authClient
        .send({ cmd: 'menu.update' }, { menuData: { id, ...menuData } })
        .pipe(defaultIfEmpty({})),
    );
    return formatResponse(200, {}, '更新菜单成功');
  }

  // 删除菜单
  @Delete(':id(\\d+)')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: number) {
    await lastValueFrom(
      this.authClient
        .send({ cmd: 'menu.remove' }, { id })
        .pipe(defaultIfEmpty({})),
    );
  }
}
