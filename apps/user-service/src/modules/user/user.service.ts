import { Profile, Role, User } from '@app/database/entities';
import { RedisService } from '@app/redis';
import { UpdateUserStatusDto } from '@common/dto/user/update-user-status.dto';
import { UpdateUserDto } from '@common/dto/user/update-user.dto';
import { UserPageQueryDto } from '@common/dto/user/user-page-query.dto';
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { formatResponse } from '@shared/helpers/response.helper';
import { hash } from 'bcrypt';
import * as fs from 'fs';
import * as mime from 'mime-types';
import * as path from 'path';
import { DataSource, In, Repository } from 'typeorm';

/**
 * 用户模块服务
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly DEFAULT_AVATAR_PATH = path.join(
    __dirname,
    '.',
    'assets',
    'avatar-xIXQgi5p.png',
  );
  private readonly avatarPath = path.join(__dirname, '..', '..', 'avatar');
  private readonly avatarCache = new Map<
    string,
    {
      data: { avatar: string; fileName: string; mimeType: string };
      timestamp: number;
    }
  >();
  private readonly CACHE_TTL = 3600000; // 1小时缓存
  private readonly MAX_CACHE_SIZE = 1000; // 最大缓存数量
  private readonly SHORT_CACHE_TTL = 300; // 5分钟缓存
  private readonly MEDIUM_CACHE_TTL = 1800; // 30分钟缓存

  // 缓存键前缀
  private readonly CACHE_KEYS = {
    USER: 'user',
    USER_LIST: 'user:list',
    USER_LOGIN: 'user:login',
    USER_EMAIL: 'user:email',
    USER_USERNAME: 'user:username',
    USER_ID: 'user:id',
    USER_ALL: 'user:all',
    AVATAR: 'avatar',
  } as const;

  // 缓存版本控制
  private readonly CACHE_VERSION = 'v1';

  // 缓存配置
  private readonly CACHE_CONFIG = {
    USER_ID: { ttl: this.MEDIUM_CACHE_TTL, version: this.CACHE_VERSION },
    USER_EMAIL: { ttl: this.MEDIUM_CACHE_TTL, version: this.CACHE_VERSION },
    USER_USERNAME: { ttl: this.MEDIUM_CACHE_TTL, version: this.CACHE_VERSION },
    USER_LOGIN: { ttl: this.SHORT_CACHE_TTL, version: this.CACHE_VERSION },
    USER_LIST: { ttl: this.SHORT_CACHE_TTL, version: this.CACHE_VERSION },
    USER_ALL: { ttl: this.SHORT_CACHE_TTL, version: this.CACHE_VERSION },
    AVATAR: { ttl: this.CACHE_TTL, version: this.CACHE_VERSION },
  } as const;

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
    const cacheKey = this.generateCacheKey('USER_ID', id);
    const cachedData = await this.redisService.hgetall(cacheKey);

    if (!cachedData) {
      return null;
    }

    // 验证缓存版本
    const config = this.CACHE_CONFIG.USER_ID;
    if (cachedData.version !== config.version) {
      await this.redisService.unlink(cacheKey);
      return null;
    }

    return JSON.parse(cachedData.data);
  }

  private async updateUserCache(user: User) {
    const { password, ...userData } = user;
    const cacheUpdates = [
      { type: 'USER_ID', key: user.id, data: userData },
      { type: 'USER_EMAIL', key: user.email, data: userData },
      { type: 'USER_USERNAME', key: user.username, data: userData },
    ];

    const pipeline = this.redisService.pipeline();

    // 使用事务确保缓存更新的原子性
    for (const { type, key, data } of cacheUpdates) {
      const cacheKey = this.generateCacheKey(
        type as keyof typeof this.CACHE_KEYS,
        key,
      );
      const config = this.CACHE_CONFIG[type as keyof typeof this.CACHE_CONFIG];

      // 使用 HSET 存储结构化数据
      pipeline.hset(cacheKey, {
        data: JSON.stringify(data),
        timestamp: Date.now(),
        version: config.version,
      });
      pipeline.expire(cacheKey, config.ttl);
    }

    await pipeline.exec();
  }

  private async updateLoginCache(user: User) {
    const cacheUpdates = [
      { type: 'USER_LOGIN', key: user.email, data: user },
      { type: 'USER_LOGIN', key: user.username, data: user },
    ];

    const pipeline = this.redisService.pipeline();

    for (const { type, key, data } of cacheUpdates) {
      const cacheKey = this.generateCacheKey(
        type as keyof typeof this.CACHE_KEYS,
        key,
      );
      const config = this.CACHE_CONFIG[type as keyof typeof this.CACHE_CONFIG];

      pipeline.hset(cacheKey, {
        data: JSON.stringify(data),
        timestamp: Date.now(),
        version: config.version,
      });
      pipeline.expire(cacheKey, config.ttl);
    }

    await pipeline.exec();
  }

  private async deleteUserCache(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'username'],
    });

    if (user) {
      const cacheKeys = [
        this.generateCacheKey('USER_ID', user.id),
        this.generateCacheKey('USER_EMAIL', user.email),
        this.generateCacheKey('USER_USERNAME', user.username),
        this.generateCacheKey('USER_LOGIN', user.email),
        this.generateCacheKey('USER_LOGIN', user.username),
      ];

      const pipeline = this.redisService.pipeline();

      // 使用 UNLINK 代替 DEL，避免阻塞
      cacheKeys.forEach((key) => {
        pipeline.unlink(key);
      });

      await pipeline.exec();
    }
  }

  // 生成缓存键的辅助方法
  private generateCacheKey(
    type: keyof typeof this.CACHE_KEYS,
    ...args: any[]
  ): string {
    const prefix = this.CACHE_KEYS[type];
    const version =
      this.CACHE_CONFIG[type as keyof typeof this.CACHE_CONFIG].version;

    switch (type) {
      case 'USER_ID':
        return `${prefix}:${version}:${args[0]}`;
      case 'USER_EMAIL':
        return `${prefix}:${version}:${args[0]}`;
      case 'USER_USERNAME':
        return `${prefix}:${version}:${args[0]}`;
      case 'USER_LOGIN':
        return `${prefix}:${version}:${args[0]}`;
      case 'USER_LIST':
        return `${prefix}:${version}:${JSON.stringify(args[0])}`;
      case 'USER_ALL':
        return `${prefix}:${version}`;
      case 'AVATAR':
        return `${prefix}:${version}:${args[0]}`;
      default:
        return `${prefix}:${version}`;
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

  private async generateUniqueUsername(email: string): Promise<string> {
    // 从邮箱中提取用户名部分
    const baseUsername = email.split('@')[0];
    let username = baseUsername;
    let counter = 1;

    // 检查用户名是否已存在
    while (await this.findByUsername(username)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    return username;
  }

  async userCreate(user: Partial<User>, profile?: Partial<Profile>) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.validateUserParams(user);

      // 如果没有提供用户名，则生成一个唯一的用户名
      if (!user.username && user.email) {
        user.username = await this.generateUniqueUsername(user.email);
      }

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

    // 更新用户缓存
    await this.updateUserCache(user);

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

    // 更新用户缓存
    await this.updateUserCache(user);

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

    // 更新用户缓存
    await this.updateUserCache(user);

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
    try {
      const cacheKey = this.generateCacheKey('AVATAR', userId);

      // 1. 检查内存缓存
      const cachedData = this.avatarCache.get(cacheKey);
      if (cachedData && Date.now() - cachedData.timestamp < this.CACHE_TTL) {
        return formatResponse(200, cachedData.data, '头像获取成功(内存缓存)');
      }

      // 2. 检查 Redis 缓存
      const cachedAvatar = await this.redisService.get<{
        buffer: Buffer;
        fileName: string;
        mimeType: string;
      }>(cacheKey);

      if (cachedAvatar) {
        // 更新内存缓存
        this.updateMemoryCache(cacheKey, cachedAvatar);
        return formatResponse(200, cachedAvatar, '头像获取成功(Redis缓存)');
      }

      // 3. 从数据库获取用户信息
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['profile'],
        select: ['id', 'profile'],
      });

      if (!user || !user.profile) {
        // 如果用户或用户资料不存在，返回默认头像
        return this.getDefaultAvatar();
      }

      const profile = user.profile;
      if (!profile.avatar) {
        // 如果用户没有设置头像，返回默认头像
        return this.getDefaultAvatar();
      }

      const avatarPath = profile.avatar;
      if (!fs.existsSync(avatarPath)) {
        // 如果头像文件不存在，返回默认头像
        return this.getDefaultAvatar();
      }

      // 4. 读取文件并处理
      const buffer = await fs.promises.readFile(avatarPath);
      const fileName = path.basename(avatarPath);
      const mimeType = mime.lookup(avatarPath) || 'application/octet-stream';

      const avatarData = {
        buffer,
        fileName,
        mimeType,
      };

      // 5. 更新缓存
      await this.updateCaches(cacheKey, avatarData);

      return formatResponse(200, avatarData, '头像获取成功');
    } catch (error) {
      this.logger.error(`获取头像失败: ${error.message}`, error.stack);
      // 发生错误时返回默认头像
      return this.getDefaultAvatar();
    }
  }

  private updateMemoryCache(key: string, data: any) {
    // 如果缓存已满，删除最旧的项
    if (this.avatarCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.avatarCache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp,
      )[0][0];
      this.avatarCache.delete(oldestKey);
    }

    this.avatarCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private async updateCaches(key: string, data: any) {
    // 更新内存缓存
    this.updateMemoryCache(key, data);

    // 更新 Redis 缓存
    await this.redisService.set(key, data, 3600);
  }

  private async getDefaultAvatar() {
    try {
      if (!fs.existsSync(this.DEFAULT_AVATAR_PATH)) {
        this.logger.error('默认头像文件不存在');
        throw new RpcException({
          code: 500,
          message: '默认头像文件不存在',
        });
      }

      const buffer = await fs.promises.readFile(this.DEFAULT_AVATAR_PATH);
      const fileName = 'avatar-xIXQgi5p.png';
      const mimeType = 'image/png';

      const avatarData = {
        buffer,
        fileName,
        mimeType,
      };

      return formatResponse(200, avatarData, '获取默认头像成功');
    } catch (error) {
      this.logger.error(`获取默认头像失败: ${error.message}`, error.stack);
      throw new RpcException({
        code: 500,
        message: '获取默认头像失败',
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
          await this.redisService.del(this.generateCacheKey('AVATAR', userId));
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
        buffer: fileData,
        fileName,
        mimeType: mimetype,
      };
      await this.redisService.set(
        this.generateCacheKey('AVATAR', userId),
        avatarData,
        3600,
      );

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

    // 更新用户缓存
    await this.updateUserCache(user);

    return formatResponse(200, null, '修改密码成功');
  }

  async userListGet(query: UserPageQueryDto) {
    try {
      const { page, pageSize, ...filters } = query;
      const offset = (page - 1) * pageSize;

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
          'role.alias',
        ])
        .cache(1000);

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
    const cacheKey = this.generateCacheKey('USER_LOGIN', login);

    // 1. 先尝试从缓存获取
    const cachedUser = await this.redisService.get<User>(cacheKey);
    if (cachedUser) {
      this.logger.debug(`从缓存获取用户数据: ${login}`);
      return cachedUser;
    }

    // 2. 缓存未命中,使用更高效的查询方式
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .where('user.email = :login OR user.username = :login', { login })
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.password',
        'user.status',
        'user.createdAt',
        'roles.id',
        'roles.name',
        'roles.alias',
      ])
      .getOne();

    if (user) {
      // 3. 更新登录相关缓存（包含密码）
      await this.updateLoginCache(user);

      // 4. 更新其他缓存（不包含密码）
      await this.updateUserCache(user);

      this.logger.debug(`更新用户缓存: ${login}`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const cacheKey = this.generateCacheKey('USER_EMAIL', email);
    const cachedUser = await this.redisService.get(cacheKey);
    if (cachedUser) {
      return cachedUser as User;
    }

    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'username', 'email', 'password', 'status'],
    });

    if (user) {
      await this.redisService.set(
        cacheKey,
        user,
        this.CACHE_CONFIG.USER_EMAIL.ttl,
      );
    }

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    const cacheKey = this.generateCacheKey('USER_USERNAME', username);
    const cachedUser = await this.redisService.get(cacheKey);
    if (cachedUser) {
      return cachedUser as User;
    }

    const user = await this.userRepository.findOne({
      where: { username },
      select: ['id', 'username', 'email', 'password', 'status'],
    });

    if (user) {
      await this.redisService.set(
        cacheKey,
        user,
        this.CACHE_CONFIG.USER_USERNAME.ttl,
      );
    }

    return user;
  }

  async findById(id: number): Promise<User | null> {
    const cacheKey = this.generateCacheKey('USER_ID', id);
    const cachedUser = await this.redisService.get(cacheKey);
    if (cachedUser) {
      return cachedUser as User;
    }

    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile', 'roles'],
    });

    if (user) {
      await this.redisService.set(cacheKey, user, 60);
    }

    return user;
  }

  async findAll(): Promise<User[]> {
    const cacheKey = this.generateCacheKey('USER_ALL');
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
