import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @MessagePattern('role.dict')
  async getRoleDict() {
    return this.roleService.findDict();
  }

  @MessagePattern('role.findAll')
  async findAll() {
    return this.roleService.findAll();
  }

  @MessagePattern('role.findOne')
  async findOne(@Payload() id: number) {
    return this.roleService.findOne(id);
  }

  @MessagePattern('role.create')
  async create(@Payload() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  @MessagePattern('role.update')
  async update(@Payload() payload: { id: number; dto: UpdateRoleDto }) {
    return this.roleService.update(payload.id, payload.dto);
  }

  @MessagePattern('role.remove')
  async remove(@Payload() id: number) {
    return this.roleService.remove(id);
  }
}
