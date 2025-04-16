import { Profile, Role, User } from '@app/database/entities';
import { RedisService } from '@app/redis';
import { UserPageQueryDto } from '@common/dto/user/user-page-query.dto';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { formatResponse } from '@shared/helpers/response.helper';
import { hash } from 'bcryptjs';
import * as fs from 'fs';
import * as mime from 'mime-types';
import * as path from 'path';
import { DataSource, In, Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';

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
    private readonly redisService: RedisService,
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

  private async getUserCache(id: number) {
    const cacheKey = `user:${id}`;
    return this.redisService.get(cacheKey);
  }

  private async updateUserCache(user: User) {
    const { password, ...userData } = user;
    const cacheKey = `user:${user.id}`;
    await this.redisService.set(cacheKey, userData, 300);
  }

  private async deleteUserCache(id: number) {
    const cacheKey = `user:${id}`;
    await this.redisService.del(cacheKey);
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
    await this.validateUserParams(user);
    await this.setRoles(user);
    await this.setDefaultPassword(user);
    const newUser = this.userRepository.create(user);
    if (profile) {
      const newProfile = this.profileRepository.create(profile);
      newUser.profile = newProfile;
    }
    const savedUser = await this.userRepository.save(newUser);
    await this.updateUserCache(savedUser);
    return formatResponse(201, savedUser, '创建用户成功');
  }

  async userGet(id: number) {
    // 尝试从缓存中获取用户信息
    const cachedUser = await this.getUserCache(id);
    if (cachedUser) {
      return formatResponse(200, cachedUser, '更新用户信息成功');
    }
    // 从数据库中获取用户信息
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
    return formatResponse(200, userData, '获取用户信息成功');
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
      await this.deleteUserCache(id);

      await queryRunner.commitTransaction();
      return formatResponse(204, null, '删除用户成功');
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
      await this.updateUserCache(user);
      return formatResponse(200, null, '更新用户信息成功');
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
    return { success: true };
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
    return formatResponse(200, null, '重置用户密码成功');
  }

  async profileGet(id: number) {
    // 尝试从缓存中获取用户信息
    const cachedUser = await this.getUserCache(id);
    if (cachedUser) {
      return cachedUser;
    }

    // 从数据库中获取用户信息
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

    return formatResponse(
      200,
      {
        ...user,
        profile: { ...user.profile, avatar: undefined },
        password: undefined,
      },
      '获取用户信息成功',
    );
  }

  async getAvatar(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });

    if (!user) {
      throw new RpcException({
        code: 404,
        message: '用户未找到',
      });
    }

    const profile = user.profile;
    if (!profile || !profile.avatar) {
      throw new RpcException({
        code: 404,
        message: '头像文件不存在',
      });
    }

    const avatarPath = profile.avatar;
    if (!fs.existsSync(avatarPath)) {
      throw new RpcException({
        code: 404,
        message: '头像文件不存在',
      });
    }

    // 读取文件
    const avatarBuffer = await fs.promises.readFile(avatarPath);
    const fileName = path.basename(avatarPath); // 获取文件名
    const mimeType = mime.lookup(avatarPath) || 'application/octet-stream'; // 获取 MIME 类型

    return formatResponse(
      200,
      {
        avatar: avatarBuffer,
        fileName,
        mimeType,
      },
      '头像获取成功',
    );
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
    await this.updateUserCache(user);
    return formatResponse(200, null, '更新个人信息成功');
  }

  async updateAvatar(userId: number, fileData: any, mimetype: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        relations: ['profile'],
      });
      if (!user) {
        throw new RpcException({
          code: 404,
          message: '用户未找到',
        });
      }
      let profile = user.profile;
      if (!profile) {
        profile = this.profileRepository.create({ user });
      }
      // 删除旧头像文件
      if (profile.avatar) {
        try {
          await fs.promises.unlink(profile.avatar);
        } catch (error) {
          console.error('删除旧头像失败:', error);
        }
      }
      // 保存头像文件
      const fileExtension = mimetype === 'image/png' ? '.png' : '.jpg';
      const fileName = `${userId}${fileExtension}`;
      const filePath = path.join(this.avatarPath, fileName);

      // 确保fileData是Buffer类型
      const bufferData = Buffer.isBuffer(fileData)
        ? fileData
        : Buffer.from(fileData);
      await fs.promises.writeFile(filePath, bufferData);

      profile.avatar = filePath;

      await queryRunner.manager.save(user);
      await queryRunner.manager.save(profile);
      await queryRunner.commitTransaction();
      return formatResponse(200, null, '上传头像成功');
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
    return formatResponse(200, null, '修改密码成功');
  }

  async userListGet(query: UserPageQueryDto) {
    try {
      const { page, pageSize, ...filters } = query;
      const offset = (page - 1) * pageSize;
      // 使用 QueryBuilder 进行查询
      const queryBuilder = this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.profile', 'profile')
        .leftJoinAndSelect('user.roles', 'role');

      if (filters.username) {
        queryBuilder.andWhere('user.username LIKE :username', {
          username: `%${filters.username}%`,
        });
      }
      if (filters.name) {
        queryBuilder.andWhere('profile.name LIKE :name', {
          name: `%${filters.name}%`,
        });
      }
      if (filters.phone) {
        queryBuilder.andWhere('profile.phone LIKE :phone', {
          phone: `%${filters.phone}%`,
        });
      }
      if (filters.address) {
        queryBuilder.andWhere('profile.address LIKE :address', {
          address: `%${filters.address}%`,
        });
      }

      // 获取总数和分页数据
      const total = await queryBuilder.getCount();
      const users = await queryBuilder.skip(offset).take(pageSize).getMany();
      // 过滤敏感信息，例如 password
      const list = users.map(({ password, ...user }) => user);
      const result = {
        list,
        total,
        page,
        pageSize,
      };

      return formatResponse(200, result, '退出登录成功');
    } catch (error) {
      throw new RpcException({
        code: 500,
        message: '获取用户列表失败',
      });
    }
  }

  async findByLogin(login: string): Promise<User | null> {
    const cacheKey = `user:login:${login}`;
    const cachedUser = await this.redisService.get(cacheKey);
    if (cachedUser) {
      return cachedUser as User;
    }

    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .where('user.email = :login', { login })
      .orWhere('user.username = :login', { login })
      .getOne();

    if (user) {
      await this.redisService.set(cacheKey, user, 60); // 缓存 60 秒
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const cacheKey = `user:email:${email}`;
    const cachedUser = await this.redisService.get(cacheKey);
    if (cachedUser) {
      return cachedUser as User;
    }

    const user = await this.userRepository.findOne({ where: { email } });

    if (user) {
      await this.redisService.set(cacheKey, user, 60);
    }

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    const cacheKey = `user:username:${username}`;
    const cachedUser = await this.redisService.get(cacheKey);
    if (cachedUser) {
      return cachedUser as User;
    }

    const user = await this.userRepository.findOne({ where: { username } });

    if (user) {
      await this.redisService.set(cacheKey, user, 60);
    }

    return user;
  }

  async findById(id: number): Promise<User | null> {
    const cacheKey = `user:id:${id}`;
    const cachedUser = await this.redisService.get(cacheKey);
    if (cachedUser) {
      return cachedUser as User;
    }

    const user = await this.userRepository.findOne({ where: { id } });

    if (user) {
      await this.redisService.set(cacheKey, user, 60);
    }

    return user;
  }

  async findAll(): Promise<User[]> {
    const cacheKey = `user:all`;
    const cachedUsers = await this.redisService.get(cacheKey);
    if (cachedUsers) {
      return cachedUsers as User[];
    }

    const users = await this.userRepository.find();

    if (users.length > 0) {
      await this.redisService.set(cacheKey, users, 300); // 5 分钟缓存
    }

    return users;
  }
}
