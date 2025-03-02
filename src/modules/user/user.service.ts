import { formatResponse } from '@/common/helpers/response.helper';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { unlink } from 'fs';
import { readFile } from 'fs/promises';
import { extname } from 'path';
import { DataSource, In, Repository } from 'typeorm';
import { Role } from '../role/role.entity';
import { UpdateUserDto } from './dto/update-user.dto';
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

  async userGet(id: number) {
    const user = await this.userRepository.findOne({
      where: { id: Number(id) },
      relations: ['profile', 'roles'],
    });

    if (!user) {
      throw new NotFoundException('用户未找到');
    }

    // 避免返回敏感数据
    const { password, ...userData } = user;

    return formatResponse(200, userData, '用户信息获取成功');
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
        throw new NotFoundException('用户未找到');
      }

      // 删除用户的 Profile 数据
      await queryRunner.manager.delete(Profile, { user });

      // 删除用户
      await queryRunner.manager.remove(User, user);

      // 提交事务
      await queryRunner.commitTransaction();

      return { message: '用户及相关数据已删除' };
    } catch (error) {
      // 回滚事务
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('删除用户失败');
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
        throw new NotFoundException('用户未找到');
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
      return formatResponse(200, null, '用户信息更新成功');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async userReset(id: number, newPassword?: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户未找到');
    }

    // 密码加密
    const hashedPassword = await hash(newPassword || '123456', 10);
    user.password = hashedPassword;
    await this.userRepository.save(user);
    return formatResponse(200, null, '用户密码重置成功');
  }

  async profileGet(id: number) {
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

    let avatarBase64: string | null = null;
    if (profile.avatar) {
      // 获取头像的绝对路径
      const avatarPath = profile.avatar;

      try {
        // 读取头像文件并转为 Base64
        const avatarBuffer = await readFile(avatarPath);
        // 获取文件的扩展名
        const fileExtension = extname(profile.avatar).toLowerCase();
        // 根据文件扩展名设置 MIME 类型
        const mimeType = fileExtension === '.png' ? 'image/png' : 'image/jpeg';
        // 转换为 Base64 字符串
        avatarBase64 = `data:${mimeType};base64,${avatarBuffer.toString('base64')}`;
      } catch (err) {
        console.error('读取头像文件出错:', err);
      }
    }

    return formatResponse(
      200,
      {
        ...profile,
        avatar: avatarBase64,
        ...user,
        password: undefined,
      },
      '个人信息获取成功',
    );
  }

  async getAvatar(userId: number) {
    const user = await this.findById(userId);
    if (!user) {
      throw new BadRequestException('无效的用户');
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
    await this.profileRepository.save(userProfile);

    return formatResponse(200, null, '个人信息更新成功');
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

      return formatResponse(200, null, '头像上传成功');
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
    await this.userRepository.save(user);
    return formatResponse(200, null, '密码修改成功');
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

      return formatResponse(
        200,
        {
          list,
          total,
          page,
          pageSize,
        },
        '用户列表获取成功',
      );
    } catch (error) {
      throw new BadRequestException('Failed to fetch user list.');
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
