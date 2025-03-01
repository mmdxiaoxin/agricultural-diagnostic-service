import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findById(roleId: number) {
    return this.roleRepository.findOne({
      where: { id: roleId },
    });
  }

  async findAll() {
    return this.roleRepository.find();
  }

  async findDict() {
    const roles = await this.findAll();
    return roles.map((role) => ({
      key: role.id,
      value: role.alias || role.name,
    }));
  }
}
