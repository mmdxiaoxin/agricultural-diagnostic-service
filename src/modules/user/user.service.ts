import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { In, Repository } from 'typeorm';
import { Role } from '../role/role.entity';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
  ) {}

  async create(user: Partial<User>) {
    if (!user.email) {
      throw new Error('Parameters');
    }
    if (!user.roles) {
      const role = (await this.roleRepository.findOne({
        where: { name: 'user' },
      })) as Role;
      user.roles = [role];
    }
    if (user.roles instanceof Array && typeof user.roles[0] === 'number') {
      // {id, name} -> { id } -> [id]
      // 查询所有的用户角色
      user.roles = await this.roleRepository.find({
        where: {
          id: In(user.roles),
        },
      });
    }
    if (!user.password) {
      user.password = '123456';
    }
    user.password = await hash(user.password, 10);
    const newUser = this.userRepository.create({ ...user });
    return this.userRepository.save(newUser);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }
}
