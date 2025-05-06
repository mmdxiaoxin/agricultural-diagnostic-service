import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { defaultIfEmpty, lastValueFrom } from 'rxjs';
import { AUTH_SERVICE_NAME } from 'config/microservice.config';
import { formatResponse } from '@shared/helpers/response.helper';

@Injectable()
export class MenuService {
  constructor(
    @Inject(AUTH_SERVICE_NAME) private readonly authClient: ClientProxy,
  ) {}

  async getRoutes(roles: string[]) {
    const routes = await lastValueFrom(
      this.authClient
        .send({ cmd: 'menu.get.routes' }, { roles })
        .pipe(defaultIfEmpty([])),
    );
    return formatResponse(200, routes, '获取个人路由权限成功');
  }

  async findAll() {
    const list = await lastValueFrom(
      this.authClient.send({ cmd: 'menu.get' }, {}).pipe(defaultIfEmpty([])),
    );
    return formatResponse(200, list, '获取所有菜单成功');
  }

  async findOne(id: number) {
    const menu = await lastValueFrom(
      this.authClient
        .send({ cmd: 'menu.get.byId' }, { id })
        .pipe(defaultIfEmpty({})),
    );
    return formatResponse(200, menu, '获取单个菜单成功');
  }

  async create(menuData: any) {
    await lastValueFrom(
      this.authClient
        .send({ cmd: 'menu.create' }, { menuData })
        .pipe(defaultIfEmpty({})),
    );
    return formatResponse(201, {}, '创建成功');
  }

  async update(id: number, menuData: any) {
    await lastValueFrom(
      this.authClient
        .send({ cmd: 'menu.update' }, { menuData: { id, ...menuData } })
        .pipe(defaultIfEmpty({})),
    );
    return formatResponse(200, {}, '更新菜单成功');
  }

  async remove(id: number) {
    await lastValueFrom(
      this.authClient
        .send({ cmd: 'menu.remove' }, { id })
        .pipe(defaultIfEmpty({})),
    );
    return formatResponse(204, null, '删除成功');
  }
}
