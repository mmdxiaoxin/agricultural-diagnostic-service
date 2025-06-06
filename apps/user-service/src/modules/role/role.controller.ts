import { CreateRoleDto } from '@common/dto/role/create-role.dto';
import { UpdateRoleDto } from '@common/dto/role/update-role.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RoleService } from './role.service';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';

@Controller()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @MessagePattern({ cmd: 'role.dict' })
  async getRoleDict() {
    return this.roleService.findDict();
  }

  @MessagePattern({ cmd: 'role.findList' })
  async findList(@Payload() payload: { dto: PageQueryKeywordsDto }) {
    return this.roleService.findList(payload.dto);
  }

  @MessagePattern({ cmd: 'role.findAll' })
  async findAll() {
    return this.roleService.findAll();
  }

  @MessagePattern({ cmd: 'role.findOne' })
  async findOne(@Payload() payload: { id: number }) {
    return this.roleService.findOne(payload.id);
  }

  @MessagePattern({ cmd: 'role.create' })
  async create(@Payload() payload: { dto: CreateRoleDto }) {
    return this.roleService.create(payload.dto);
  }

  @MessagePattern({ cmd: 'role.update' })
  async update(@Payload() payload: { id: number; dto: UpdateRoleDto }) {
    return this.roleService.update(payload.id, payload.dto);
  }

  @MessagePattern({ cmd: 'role.remove' })
  async remove(@Payload() payload: { id: number }) {
    return this.roleService.remove(payload.id);
  }
}
