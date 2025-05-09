import { Menu } from '@app/database/entities/menu.entity';
import {
  CreateMenuRequest,
  CreateMenuResponse,
  FindAllResponse,
  FindOneRequest,
  FindOneResponse,
  GetRoutesRequest,
  GetRoutesResponse,
  RemoveMenuRequest,
  RemoveMenuResponse,
  UpdateMenuRequest,
  UpdateMenuResponse,
  ConfigureRolesRequest,
  ConfigureRolesResponse,
} from '@common/types/auth';
import { Controller } from '@nestjs/common';
import { GrpcMethod, MessagePattern, Payload } from '@nestjs/microservices';
import { MenuService } from './menu.service';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // TCP endpoints
  @MessagePattern({ cmd: 'menu.get.routes' })
  async getRoutes(@Payload() data: { roles: string[] }) {
    return this.menuService.findAuthRoutes(data.roles);
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

  // gRPC endpoints
  @GrpcMethod('MenuService', 'GetRoutes')
  async grpcGetRoutes(data: GetRoutesRequest): Promise<GetRoutesResponse> {
    const response = await this.menuService.findAuthRoutes(data.roles);
    const routes =
      response.data?.map((menu) => ({
        id: menu.id,
        name: menu.title,
        path: menu.path,
        component: menu.isLink || '',
        icon: menu.icon,
        parentId: menu.parentId || 0,
        order: menu.sort,
        hidden: false,
        roles: menu.roles.map((role) => role.name),
      })) || [];
    return {
      success: response.code === 200,
      routes,
    };
  }

  @GrpcMethod('MenuService', 'FindAll')
  async grpcFindAll(): Promise<FindAllResponse> {
    const response = await this.menuService.findAll();
    const menus =
      response.data?.map((menu) => ({
        id: menu.id,
        name: menu.title,
        path: menu.path,
        component: menu.isLink || '',
        icon: menu.icon,
        parentId: menu.parentId || 0,
        order: menu.sort,
        hidden: false,
        roles: menu.roles.map((role) => role.name),
      })) || [];
    return {
      success: response.code === 200,
      menus,
    };
  }

  @GrpcMethod('MenuService', 'FindOne')
  async grpcFindOne(data: FindOneRequest): Promise<FindOneResponse> {
    const response = await this.menuService.findOne(data.id);
    const menu = response.data
      ? {
          id: response.data.id,
          name: response.data.title,
          path: response.data.path,
          component: response.data.isLink || '',
          icon: response.data.icon,
          parentId: response.data.parentId || 0,
          order: response.data.sort,
          hidden: false,
          roles: response.data.roles.map((role) => role.name),
        }
      : undefined;
    return {
      success: response.code === 200,
      menu,
    };
  }

  @GrpcMethod('MenuService', 'Create')
  async grpcCreate(data: CreateMenuRequest): Promise<CreateMenuResponse> {
    if (!data.menu) {
      return { success: false, menu: undefined };
    }
    const menuData = {
      title: data.menu.name,
      path: data.menu.path,
      isLink: data.menu.component,
      icon: data.menu.icon,
      parentId: data.menu.parentId || undefined,
      sort: data.menu.order,
    };
    const response = await this.menuService.create(menuData);
    const menu = response.data
      ? {
          id: response.data.id,
          name: response.data.title,
          path: response.data.path,
          component: response.data.isLink || '',
          icon: response.data.icon,
          parentId: response.data.parentId || 0,
          order: response.data.sort,
          hidden: false,
          roles: response.data.roles.map((role) => role.name),
        }
      : undefined;
    return {
      success: response.code === 201,
      menu,
    };
  }

  @GrpcMethod('MenuService', 'Update')
  async grpcUpdate(data: UpdateMenuRequest): Promise<UpdateMenuResponse> {
    if (!data.menu || !data.menu.id) {
      return { success: false, menu: undefined };
    }
    const menuData = {
      title: data.menu.name,
      path: data.menu.path,
      isLink: data.menu.component,
      icon: data.menu.icon,
      parentId: data.menu.parentId || undefined,
      sort: data.menu.order,
    };
    const response = await this.menuService.update(data.menu.id, menuData);
    const updatedMenu = await this.menuService.findOne(data.menu.id);
    const menu = updatedMenu.data
      ? {
          id: updatedMenu.data.id,
          name: updatedMenu.data.title,
          path: updatedMenu.data.path,
          component: updatedMenu.data.isLink || '',
          icon: updatedMenu.data.icon,
          parentId: updatedMenu.data.parentId || 0,
          order: updatedMenu.data.sort,
          hidden: false,
          roles: updatedMenu.data.roles.map((role) => role.name),
        }
      : undefined;
    return {
      success: response.code === 200,
      menu,
    };
  }

  @GrpcMethod('MenuService', 'Remove')
  async grpcRemove(data: RemoveMenuRequest): Promise<RemoveMenuResponse> {
    const response = await this.menuService.remove(data.id);
    return {
      success: response.code === 204,
    };
  }

  @GrpcMethod('MenuService', 'ConfigureRoles')
  async grpcConfigureRoles(
    data: ConfigureRolesRequest,
  ): Promise<ConfigureRolesResponse> {
    const response = await this.menuService.configureRoles(
      data.menuId,
      data.roleIds,
    );
    return {
      success: response.code === 200,
    };
  }
}
