import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { unlink } from 'fs';
import { DataSource, In, Repository } from 'typeorm';
import { Role } from '../role/role.entity';
import { Profile } from './profile.entity';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private dataSource: DataSource,
  ) {}

  async create(user: Partial<User>) {
    if (!user.email) {
      throw new BadRequestException('缺少邮箱参数');
    }
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
    const newUser = this.userRepository.create(user);
    return this.userRepository.save(newUser);
  }

  async getProfile(id: number) {
    const user = await this.findById(id);
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    let profile = await this.profileRepository.findOne({
      where: { user },
    });

    if (!profile) {
      profile = new Profile(); // 创建一个新的 Profile 实例
      profile.user = user; // 关联用户
      await this.profileRepository.save(profile);
    }

    return {
      ...profile,
      user: undefined,
    };
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
