import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { Request } from 'express';
import { unlink } from 'fs';
import { DataSource, In, Repository } from 'typeorm';
import { Role } from '../role/role.entity';
import { Profile } from './models/profile.entity';
import { User } from './models/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private jwt: JwtService,
    private dataSource: DataSource,
  ) {}

  private async validateUserParams(user: Partial<User>) {
    if (!user.email && !user.username) {
      throw new BadRequestException('缺少关键参数-email或-username');
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
        throw new InternalServerErrorException('user角色未创建');
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

  async getProfile(id: number, req: Request) {
    const user = await this.findById(id);
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    let profile = await this.profileRepository.findOne({
      where: { user },
    });

    if (!profile) {
      profile = new Profile();
      profile.user = user;
      await this.profileRepository.save(profile);
    }

    let avatarUrl: string | null = null;
    if (profile.avatar) {
      const token = this.jwt.sign({ userId: user.id });
      const serverUrl = `${req.protocol}://${req.get('host')}`; // 动态获取服务器地址
      avatarUrl = `${serverUrl}/user/avatar/${token}`;
    }

    return {
      ...profile,
      avatar: avatarUrl,
      user: undefined,
    };
  }

  async getAvatar(token: string) {
    try {
      const payload = this.jwt.verify(token);
      const user = await this.findById(payload.userId);
      if (!user) {
        throw new BadRequestException('无效的用户');
      }

      const profile = await this.profileRepository.findOne({ where: { user } });
      if (!profile || !profile.avatar) {
        throw new NotFoundException('用户头像不存在');
      }
      return profile.avatar;
    } catch (error) {
      throw new BadRequestException('无效或过期的 token');
    }
  }

  async updateProfile(userId: number, profile: Partial<Profile>) {
    const user = await this.findById(userId);
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    let userProfile = await this.profileRepository.findOne({
      where: { user },
    });

    if (!userProfile) {
      userProfile = new Profile();
      userProfile.user = user;
    }

    Object.assign(userProfile, profile);

    return this.profileRepository.save(userProfile);
  }

  async updateAvatar(userId: number, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('缺少文件参数或上传失败');
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
        throw new BadRequestException('用户不存在');
      }

      let profile = await queryRunner.manager.findOne(Profile, {
        where: { user },
      });

      if (!profile) {
        profile = new Profile();
        profile.user = user;
      } else if (profile.avatar) {
        // **不能直接使用 fs.unlinkSync，因为事务可能回滚**
        unlink(profile.avatar, (err) => {
          if (err) console.error('删除旧头像失败:', err);
        });
      }

      profile.avatar = file.path;

      // 使用事务管理器保存
      await queryRunner.manager.save(profile);

      // 提交事务
      await queryRunner.commitTransaction();

      return profile;
    } catch (error) {
      // 发生错误时回滚
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // 释放 queryRunner
      await queryRunner.release();
    }
  }

  async updatePassword(userId: number, password: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    user.password = await hash(password, 10);
    return this.userRepository.save(user);
  }

  async getUserList(
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
        .leftJoinAndSelect('user.profile', 'profile');

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
      throw new BadRequestException('Failed to fetch user list.');
    }
  }

  async findByLogin(login: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
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
