import {
  ApiErrorResponse,
  ApiNullResponse,
  ApiResponse,
} from '@common/decorator/api-response.decorator';
import { Roles } from '@common/decorator/roles.decorator';
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
  Inject,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@shared/enum/role.enum';
import { formatResponse } from '@shared/helpers/response.helper';
import { AUTH_SERVICE_NAME } from 'config/microservice.config';
import { Request } from 'express';
import { defaultIfEmpty, lastValueFrom } from 'rxjs';

@ApiTags('菜单管理')
@UseGuards(AuthGuard)
@Controller('menu')
@ApiBearerAuth()
export class MenuController {
  constructor(
    @Inject(AUTH_SERVICE_NAME) private readonly authClient: ClientProxy,
  ) {}

  @Get('routes')
  @ApiOperation({
    summary: '获取个人路由权限',
    description: '获取当前登录用户的路由权限列表',
  })
  @ApiResponse(HttpStatus.OK, '获取成功', RouteItemDto, true)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  async getRoutes(@Req() req: Request) {
    const roles = req.user.roles;
    const routes = await lastValueFrom(
      this.authClient
        .send({ cmd: 'menu.get.routes' }, { roles })
        .pipe(defaultIfEmpty([])),
    );
    return formatResponse(200, routes, '获取个人路由权限成功');
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
    const list = await lastValueFrom(
      this.authClient.send({ cmd: 'menu.get' }, {}).pipe(defaultIfEmpty([])),
    );
    return formatResponse(200, list, '获取所有菜单成功');
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
    const menu = await lastValueFrom(
      this.authClient
        .send({ cmd: 'menu.get.byId' }, { id })
        .pipe(defaultIfEmpty({})),
    );
    return formatResponse(200, menu, '获取单个菜单成功');
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
    await lastValueFrom(
      this.authClient
        .send({ cmd: 'menu.create' }, { menuData })
        .pipe(defaultIfEmpty({})),
    );
    return formatResponse(201, {}, '创建成功');
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
    await lastValueFrom(
      this.authClient
        .send({ cmd: 'menu.update' }, { menuData: { id, ...menuData } })
        .pipe(defaultIfEmpty({})),
    );
    return formatResponse(200, {}, '更新菜单成功');
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
    await lastValueFrom(
      this.authClient
        .send({ cmd: 'menu.remove' }, { id })
        .pipe(defaultIfEmpty({})),
    );
  }
}
