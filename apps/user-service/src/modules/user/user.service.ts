import { Profile, Role, User } from '@app/database/entities';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { formatResponse } from '@shared/helpers/response.helper';
import { hash } from 'bcryptjs';
import { readFile } from 'fs/promises';
import { extname, join } from 'path';
import { DataSource, In, Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 用户模块服务
 */
@Injectable()
export class UserService {
  private avatarPath = path.join(__dirname, '..', '..', 'avatar');

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,

    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,

    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,

    private dataSource: DataSource,
  ) {
    // 检查头像文件夹是否存在
    if (!fs.existsSync(this.avatarPath)) {
      fs.mkdirSync(this.avatarPath);
    }
  }

  private async validateUserParams(user: Partial<User>) {
    if (!user.email && !user.username) {
      throw new RpcException('缺少关键参数-email或-username');
    }
  }

  private async setDefaultPassword(user: Partial<User>) {
    if (!user.password) {
      user.password = '123456';
    }
    user.password = await hash(user.password, 10);
  }

  async setRoles(user: Partial<User>) {
    if (!user.roles) {
      const role = await this.roleRepository.findOne({
        where: { name: 'user' },
      });
      if (!role) {
        throw new RpcException('user角色未创建');
      }
      user.roles = [role];
    }

    if (user.roles instanceof Array && typeof user.roles[0] === 'number') {
      user.roles = await this.roleRepository.find({
        where: { id: In(user.roles) },
      });
    }
  }

  async userCreate(user: Partial<User>, profile?: Partial<Profile>) {
    await this.validateUserParams(user); // 验证参数
    await this.setRoles(user); // 设置角色
    await this.setDefaultPassword(user); // 设置默认密码
    const newUser = this.userRepository.create(user);
    if (profile) {
      const newProfile = this.profileRepository.create(profile);
      newUser.profile = newProfile;
    }
    return this.userRepository.save(newUser);
  }

  async userGet(id: number) {
    const user = await this.userRepository.findOne({
      where: { id: Number(id) },
      relations: ['profile', 'roles'],
    });

    if (!user) {
      throw new RpcException({
        code: 404,
        message: '用户未找到',
      });
    }

    // 避免返回敏感数据
    const { password, ...userData } = user;

    return userData;
  }

  async userDelete(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id },
      });

      if (!user) {
        throw new RpcException({
          code: 404,
          message: '用户未找到',
        });
      }

      // 删除用户
      await queryRunner.manager.delete(Profile, { user });
      await queryRunner.manager.remove(User, user);

      await queryRunner.commitTransaction();
    } catch (error) {
      // 回滚事务
      await queryRunner.rollbackTransaction();
      throw new RpcException('删除用户失败');
    } finally {
      // 释放 queryRunner
      await queryRunner.release();
    }
  }

  async userUpdate(id: number, updateUserDto: UpdateUserDto) {
    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const { profile, roles, ...userData } = updateUserDto;
    try {
      // 查找用户
      const user = await queryRunner.manager.findOne(User, {
        where: { id },
        relations: ['profile', 'roles'],
      });

      if (!user) {
        throw new RpcException({
          code: 404,
          message: '用户未找到',
        });
      }

      // 处理信息更新
      if (!user.profile && profile) {
        user.profile = queryRunner.manager.create(Profile, profile);
      } else if (user.profile && profile) {
        Object.assign(user.profile, profile);
      }

      // 处理角色更新
      if (roles) {
        const newRoles = await queryRunner.manager.find(Role, {
          where: { id: In(roles) },
        });
        user.roles = newRoles;
      }

      Object.assign(user, userData);

      await queryRunner.manager.save(user);
      if (profile) {
        await queryRunner.manager.save(user.profile);
      }
      if (roles) {
        await queryRunner.manager.save(user.roles);
      }

      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async userActivate(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new RpcException({
        code: 404,
        message: '用户未找到',
      });
    }

    user.status = 1;
    await this.userRepository.save(user);
    return true;
  }

  async userReset(id: number, newPassword?: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new RpcException({
        code: 404,
        message: '用户未找到',
      });
    }

    // 密码加密
    const hashedPassword = await hash(newPassword || '123456', 10);
    user.password = hashedPassword;
    await this.userRepository.save(user);
    return formatResponse(200, null, '用户密码重置成功');
  }

  async profileGet(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile', 'roles'],
    });
    if (!user) {
      throw new RpcException({
        code: 404,
        message: '用户未找到',
      });
    }
    if (!user.profile) {
      const profile = this.profileRepository.create();
      profile.user = user;
      await this.profileRepository.save(profile);
    }

    return {
      ...user,
      profile: { ...user.profile, avatar: undefined },
      password: undefined,
    };
  }

  async getAvatar(userId: number) {
    const user = await this.findById(userId);
    if (!user) {
      throw new RpcException({
        code: 404,
        message: '用户未找到',
      });
    }
    const profile = await this.profileRepository.findOne({ where: { user } });
    if (!profile || !profile.avatar) {
      return null;
    }
    return profile.avatar;
  }

  async profileUpdate(userId: number, profile: Partial<Profile>) {
    const user = await this.findById(userId);
    if (!user) {
      throw new RpcException({
        code: 404,
        message: '用户未找到',
      });
    }

    let userProfile = await this.profileRepository.findOne({
      where: { user },
    });

    if (!userProfile) {
      userProfile = new Profile();
      userProfile.user = user;
    }

    Object.assign(userProfile, profile);
    await this.profileRepository.save(userProfile);
  }

  async updateAvatar(userId: number, fileData: Buffer, mimetype: string) {
    if (!fileData) {
      throw new RpcException({
        code: 400,
        message: '缺少文件参数或上传失败',
      });
    }
    // 创建 queryRunner 进行事务管理
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });
      if (!user) {
        throw new RpcException({
          code: 404,
          message: '用户未找到',
        });
      }
      let profile = await queryRunner.manager.findOne(Profile, {
        where: { user },
      });
      if (!profile) {
        profile = this.profileRepository.create();
        profile.user = user;
      } else if (profile.avatar) {
        fs.unlink(profile.avatar, (err) => {
          if (err) console.error('删除旧头像失败:', err);
        });
      }

      // 保存头像文件
      const fileExtension = mimetype === 'image/png' ? '.png' : '.jpg';
      const fileName = `${userId}${fileExtension}`;
      const filePath = path.join(this.avatarPath, fileName);
      fs.writeFileSync(filePath, fileData);

      await queryRunner.manager.save(profile);
      await queryRunner.commitTransaction();
    } catch (error) {
      // 发生错误时回滚
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updatePassword(userId: number, password: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new RpcException({
        code: 404,
        message: '用户未找到',
      });
    }
    user.password = await hash(password, 10);
    await this.userRepository.save(user);
  }

  async userListGet(
    page: number = 1,
    pageSize: number = 10,
    filters: {
      username?: string;
      name?: string;
      phone?: string;
      address?: string;
    },
  ) {
    try {
      const offset = (page - 1) * pageSize;

      // 使用 QueryBuilder 进行多表查询
      const queryBuilder = this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.profile', 'profile')
        .leftJoinAndSelect('user.roles', 'role');

      // 添加查询条件
      if (filters.username)
        queryBuilder.andWhere('user.username LIKE :username', {
          username: `%${filters.username}%`,
        });
      if (filters.name)
        queryBuilder.andWhere('profile.name LIKE :name', {
          name: `%${filters.name}%`,
        });
      if (filters.phone)
        queryBuilder.andWhere('profile.phone LIKE :phone', {
          phone: `%${filters.phone}%`,
        });
      if (filters.address)
        queryBuilder.andWhere('profile.address LIKE :address', {
          address: `%${filters.address}%`,
        });

      // 查询总数
      const total = await queryBuilder.getCount();

      // 分页
      const users = await queryBuilder.skip(offset).take(pageSize).getMany();

      // 过滤敏感信息
      const list = users.map(({ password, ...user }) => user);

      return {
        list,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      throw new RpcException('Failed to fetch user list.');
    }
  }

  async findByLogin(login: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .where('user.email = :login', { login })
      .orWhere('user.username = :login', { login })
      .getOne();
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
