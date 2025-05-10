import {
  MenusConfigDto,
  RolesConfigDto,
} from '@common/dto/menu/menu-config.dto';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AUTH_SERVICE_NAME } from 'config/microservice.config';

@Injectable()
export class MenuService {
  constructor(
    @Inject(AUTH_SERVICE_NAME) private readonly authClient: ClientProxy,
  ) {}

  getRoutes(roles: string[]) {
    return this.authClient.send({ cmd: 'menu.get.routes' }, { roles });
  }

  findAll() {
    return this.authClient.send({ cmd: 'menu.get' }, {});
  }

  findOne(id: number) {
    return this.authClient.send({ cmd: 'menu.get.byId' }, { id });
  }

  create(menuData: any) {
    return this.authClient.send({ cmd: 'menu.create' }, { menuData });
  }

  update(id: number, menuData: any) {
    return this.authClient.send(
      { cmd: 'menu.update' },
      { menuData: { id, ...menuData } },
    );
  }

  remove(id: number) {
    return this.authClient.send({ cmd: 'menu.remove' }, { id });
  }

  getRoleMenuById(roleId: number) {
    return this.authClient.send({ cmd: 'menu.get.role.by.id' }, { roleId });
  }

  configureMenuRoles(data: RolesConfigDto) {
    return this.authClient.send({ cmd: 'menu.configure.roles' }, data);
  }

  configureMenuMenus(data: MenusConfigDto) {
    return this.authClient.send({ cmd: 'menu.configure.menus' }, data);
  }
}
