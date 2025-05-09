import { Role } from '@app/database/entities';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';
import { CreateRoleDto } from '@common/dto/role/create-role.dto';
import { UpdateRoleDto } from '@common/dto/role/update-role.dto';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  // 获取角色列表
  async findList(dto: PageQueryKeywordsDto) {
    const { page, pageSize, keyword } = dto;
    const [roles, total] = await this.roleRepository.findAndCount({
      where: { name: Like(`%${keyword}%`) },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      list: roles,
      total,
      page,
      pageSize,
    };
  }

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
      throw new RpcException({
        code: 404,
        message: '角色不存在',
      });
    }
    return role;
  }

  // 创建角色
  async create(dto: CreateRoleDto) {
    if (await this.roleRepository.findOne({ where: { name: dto.name } })) {
      throw new RpcException({
        code: 400,
        message: '角色已存在',
      });
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
