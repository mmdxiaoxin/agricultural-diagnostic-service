import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  // 获取所有角色
  async findAll() {
    return await this.roleRepository.find();
  }

  // 获取单个角色
  async findOne(id: number) {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['users'],
    });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    return role;
  }

  // 创建角色
  async create(dto: CreateRoleDto) {
    if (await this.roleRepository.findOne({ where: { name: dto.name } })) {
      throw new BadRequestException('角色已存在');
    }
    const role = this.roleRepository.create(dto);
    return await this.roleRepository.save(role);
  }

  // 更新角色
  async update(id: number, dto: UpdateRoleDto) {
    const role = await this.findOne(id);
    Object.assign(role, dto);
    return await this.roleRepository.save(role);
  }

  // 删除角色
  async remove(id: number) {
    const role = await this.findOne(id);
    await this.roleRepository.remove(role);
  }

  // 角色字典
  async findDict() {
    const roles = await this.findAll();
    return roles.map((role) => ({
      key: role.id,
      value: role.alias || role.name,
    }));
  }
}
