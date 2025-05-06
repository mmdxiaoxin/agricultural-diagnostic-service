import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AUTH_SERVICE_NAME } from 'config/microservice.config';
import { defaultIfEmpty, lastValueFrom } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class MenuService {
  constructor(
    @Inject(AUTH_SERVICE_NAME) private readonly authClient: ClientProxy,
  ) {}

  async getRoutes(req: Request) {
    const roles = req.user.roles;
    const routes = await lastValueFrom(
      this.authClient
        .send({ cmd: 'menu.get.routes' }, { roles })
        .pipe(defaultIfEmpty([])),
    );
    return routes;
  }

  async findAll() {
    const list = await lastValueFrom(
      this.authClient.send({ cmd: 'menu.get' }, {}).pipe(defaultIfEmpty([])),
    );
    return list;
  }

  async findOne(id: number) {
    const menu = await lastValueFrom(
      this.authClient
        .send({ cmd: 'menu.get.byId' }, { id })
        .pipe(defaultIfEmpty({})),
    );
    return menu;
  }

  async create(menuData: any) {
    await lastValueFrom(
      this.authClient
        .send({ cmd: 'menu.create' }, { menuData })
        .pipe(defaultIfEmpty({})),
    );
  }

  async update(id: number, menuData: any) {
    await lastValueFrom(
      this.authClient
        .send({ cmd: 'menu.update' }, { menuData: { id, ...menuData } })
        .pipe(defaultIfEmpty({})),
    );
  }

  async remove(id: number) {
    await lastValueFrom(
      this.authClient
        .send({ cmd: 'menu.remove' }, { id })
        .pipe(defaultIfEmpty({})),
    );
  }
}
