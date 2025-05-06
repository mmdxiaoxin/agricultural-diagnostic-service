import { Profile, Role, User } from '@app/database/entities';
import { RedisService } from '@app/redis';
import { UpdateUserStatusDto } from '@common/dto/user/update-user-status.dto';
import { UserPageQueryDto } from '@common/dto/user/user-page-query.dto';
import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(UserService.name);
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
    const cacheKeys = [
      `user:${user.id}`,
      `user:email:${user.email}`,
      `user:username:${user.username}`,
      `user:login:${user.email}`,
      `user:login:${user.username}`,
    ];

    await Promise.all(
      cacheKeys.map((key) => this.redisService.set(key, userData, 300)),
    );
  }

  private async deleteUserCache(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'username'],
    });

    if (user) {
      const cacheKeys = [
        `user:${user.id}`,
        `user:email:${user.email}`,
        `user:username:${user.username}`,
        `user:login:${user.email}`,
        `user:login:${user.username}`,
      ];

      await Promise.all(cacheKeys.map((key) => this.redisService.del(key)));
    }
  }

  async setRoles(user: Partial<User>) {
    if (!user.roles) {
      const role = await this.roleRepository.findOne({
        where: { name: 'user' },
      });
      if (!role) {
        throw new RpcException('用户角色未创建');
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
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.validateUserParams(user);
      await this.setRoles(user);
      await this.setDefaultPassword(user);

      const newUser = this.userRepository.create(user);
      if (profile) {
        const newProfile = this.profileRepository.create(profile);
        newUser.profile = newProfile;
      }

      const savedUser = await queryRunner.manager.save(newUser);
      if (profile) {
        await queryRunner.manager.save(newUser.profile);
      }

      await queryRunner.commitTransaction();

      // 更新缓存
      await this.updateUserCache(savedUser);

      return formatResponse(201, savedUser, '用户创建成功');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`创建用户失败: ${error.message}`, error.stack);
      throw new RpcException({
        code: 500,
        message: '创建用户失败',
      });
    } finally {
      await queryRunner.release();
    }
  }

  async userGet(id: number) {
    // 尝试从缓存中获取用户信息
    const cachedUser = await this.getUserCache(id);
    if (cachedUser) {
      return formatResponse(200, cachedUser, '用户信息获取成功');
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
        relations: ['profile'],
        select: ['id', 'profile'],
      });

      if (!user) {
        throw new RpcException({
          code: 404,
          message: '用户未找到',
        });
      }

      // 删除用户相关数据
      if (user.profile) {
        await queryRunner.manager.delete(Profile, { id: user.profile.id });
      }
      await queryRunner.manager.delete(User, { id });

      await queryRunner.commitTransaction();

      // 清理缓存
      await this.deleteUserCache(id);

      return formatResponse(204, null, '删除用户成功');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`删除用户失败: ${error.message}`, error.stack);
      throw new RpcException({
        code: 500,
        message: '删除用户失败',
      });
    } finally {
      await queryRunner.release();
    }
  }

  async userUpdate(id: number, updateUserDto: UpdateUserDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { profile, roles, ...userData } = updateUserDto;

      // 查找用户
      const user = await queryRunner.manager.findOne(User, {
        where: { id },
        relations: ['profile', 'roles'],
        select: ['id', 'username', 'email', 'status', 'profile', 'roles'],
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
          select: ['id', 'name'],
        });
        user.roles = newRoles;
      }

      // 更新用户信息
      Object.assign(user, userData);

      // 保存更新
      await queryRunner.manager.save(user);
      if (profile) {
        await queryRunner.manager.save(user.profile);
      }

      await queryRunner.commitTransaction();

      // 更新缓存
      await this.updateUserCache(user);

      return formatResponse(200, null, '用户信息更新成功');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`更新用户失败: ${error.message}`, error.stack);
      throw new RpcException({
        code: 500,
        message: '更新用户失败',
      });
    } finally {
      await queryRunner.release();
    }
  }

  async userStatusUpdate(id: number, dto: UpdateUserStatusDto) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new RpcException({
        code: 404,
        message: '用户未找到',
      });
    }

    user.status = dto.status;
    await this.userRepository.save(user);
    return formatResponse(200, null, '用户状态更新成功');
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
      return formatResponse(200, cachedUser, '获取用户信息成功');
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
    // 尝试从缓存获取头像
    const cacheKey = `avatar:${userId}`;
    const cachedAvatar = await this.redisService.get<{
      avatar: string;
      fileName: string;
      mimeType: string;
    }>(cacheKey);

    if (cachedAvatar) {
      return formatResponse(200, cachedAvatar, '头像获取成功(缓存)');
    }

    // 从数据库获取用户信息
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
      select: ['id', 'profile'],
    });

    if (!user) {
      throw new RpcException({
        code: 404,
        message: '未找到用户',
      });
    }

    const profile = user.profile;
    if (!profile || !profile.avatar) {
      return formatResponse(200, null, '未找到头像');
    }

    const avatarPath = profile.avatar;
    if (!fs.existsSync(avatarPath)) {
      throw new RpcException({
        code: 404,
        message: '未找到头像文件',
      });
    }

    try {
      // 读取文件
      const avatarBuffer = await fs.promises.readFile(avatarPath);
      const fileName = path.basename(avatarPath);
      const mimeType = mime.lookup(avatarPath) || 'application/octet-stream';

      const avatarData = {
        avatar: avatarBuffer.toString('base64'),
        fileName,
        mimeType,
      };

      // 缓存头像数据（1小时）
      await this.redisService.set(cacheKey, avatarData, 3600);

      return formatResponse(200, avatarData, '头像获取成功');
    } catch (error) {
      this.logger.error(`读取头像文件失败: ${error.message}`, error.stack);
      throw new RpcException({
        code: 500,
        message: '读取头像文件失败',
      });
    }
  }

  async profileUpdate(userId: number, profile: Partial<Profile>) {
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

    let userProfile = user.profile;
    if (!userProfile) {
      userProfile = this.profileRepository.create({ user });
    }

    Object.assign(userProfile, profile);
    await this.profileRepository.save(userProfile);
    await this.updateUserCache(user);
    return formatResponse(200, null, '更新个人信息成功');
  }

  async updateAvatar(userId: number, fileData: Buffer, mimetype: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 获取用户信息
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        relations: ['profile'],
        select: ['id', 'profile'],
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

      // 删除旧头像文件和缓存
      if (profile.avatar) {
        try {
          await fs.promises.unlink(profile.avatar);
          await this.redisService.del(`avatar:${userId}`);
        } catch (error) {
          this.logger.warn(`删除旧头像失败: ${error.message}`);
        }
      }

      // 生成新的文件名和路径
      const fileExtension = mimetype === 'image/png' ? '.png' : '.jpg';
      const fileName = `${userId}_${Date.now()}${fileExtension}`;
      const filePath = path.join(this.avatarPath, fileName);

      // 保存新头像
      await fs.promises.writeFile(filePath, fileData);

      // 更新数据库
      profile.avatar = filePath;
      await queryRunner.manager.save(profile);

      // 更新缓存
      const avatarData = {
        avatar: fileData.toString('base64'),
        fileName,
        mimeType: mimetype,
      };
      await this.redisService.set(`avatar:${userId}`, avatarData, 3600);

      await queryRunner.commitTransaction();
      return formatResponse(200, null, '上传头像成功');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`上传头像失败: ${error.message}`, error.stack);
      throw new RpcException({
        code: 500,
        message: '上传头像失败',
      });
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
      const cacheKey = `user:list:${JSON.stringify(query)}`;

      // 尝试从缓存获取
      const cachedResult = await this.redisService.get<{
        list: any[];
        total: number;
        page: number;
        pageSize: number;
      }>(cacheKey);

      if (cachedResult) {
        return formatResponse(200, cachedResult, '获取用户列表成功(缓存)');
      }

      // 构建查询
      const queryBuilder = this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.profile', 'profile')
        .leftJoinAndSelect('user.roles', 'role')
        .select([
          'user.id',
          'user.username',
          'user.email',
          'user.status',
          'profile.id',
          'profile.name',
          'profile.phone',
          'profile.address',
          'role.id',
          'role.name',
        ]);

      // 添加过滤条件
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

      // 添加排序
      queryBuilder.orderBy('user.id', 'DESC');

      // 获取总数和分页数据
      const [total, users] = await Promise.all([
        queryBuilder.getCount(),
        queryBuilder.skip(offset).take(pageSize).getMany(),
      ]);

      // 过滤敏感信息
      const list = users.map(({ password, ...user }) => user);
      const result = {
        list,
        total,
        page,
        pageSize,
      };

      // 缓存结果（5分钟）
      await this.redisService.set(cacheKey, result, 300);

      return formatResponse(200, result, '获取用户列表成功');
    } catch (error) {
      this.logger.error(`获取用户列表失败: ${error.message}`, error.stack);
      throw new RpcException({
        code: 500,
        message: '获取用户列表失败',
      });
    }
  }

  async findByLogin(login: string): Promise<User | null> {
    const cacheKey = `user:login:${login}`;
    const cachedUser = await this.redisService.get<User>(cacheKey);
    if (cachedUser) {
      return cachedUser;
    }

    // 使用更高效的查询方式
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.password',
        'user.status',
        'role.id',
        'role.name',
      ])
      .where('user.email = :login', { login })
      .orWhere('user.username = :login', { login })
      .cache(true) // 启用 TypeORM 查询缓存
      .getOne();

    if (user) {
      // 增加缓存时间到5分钟
      await this.redisService.set(cacheKey, user, 300);

      // 同时更新其他相关缓存
      await Promise.all([
        this.redisService.set(`user:email:${user.email}`, user, 300),
        this.redisService.set(`user:username:${user.username}`, user, 300),
        this.redisService.set(`user:id:${user.id}`, user, 300),
      ]);
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
