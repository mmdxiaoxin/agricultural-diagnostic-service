import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/change-pass.dto';
import { ResetPasswordDto } from './dto/reset-pass.dto';

/**
 * 用户模块微服务控制器
 */
@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 获取个人信息
  @MessagePattern({ cmd: 'user.profile.get' })
  async profileGet(@Payload() payload: { userId: number }) {
    return this.userService.profileGet(payload.userId);
  }

  // 更新个人信息
  @MessagePattern({ cmd: 'user.profile.update' })
  async profileUpdate(
    @Payload() payload: { userId: number; dto: UpdateProfileDto },
  ) {
    return this.userService.profileUpdate(payload.userId, payload.dto);
  }

  // 上传个人头像
  @MessagePattern({ cmd: 'user.avatar.upload' })
  async uploadAvatar(
    @Payload() payload: { userId: number; file: Express.Multer.File },
  ) {
    return this.userService.updateAvatar(payload.userId, payload.file);
  }

  // 获取个人头像路径
  @MessagePattern({ cmd: 'user.avatar.get' })
  async getAvatar(@Payload() payload: { userId: number }) {
    return this.userService.getAvatar(payload.userId);
  }

  // 修改密码
  @MessagePattern({ cmd: 'user.password.update' })
  async updatePassword(
    @Payload() payload: { userId: number; dto: UpdatePasswordDto },
  ) {
    return this.userService.updatePassword(
      payload.userId,
      payload.dto.confirmPassword,
    );
  }

  // 退出登录
  @MessagePattern({ cmd: 'user.logout' })
  async logout() {
    return { status: 200, message: '退出登录成功' };
  }

  // 获取用户列表 (需要管理员权限)
  @MessagePattern({ cmd: 'user.list.get' })
  async userListGet(
    @Payload()
    payload: {
      page?: number;
      pageSize?: number;
      username?: string;
      name?: string;
      phone?: string;
      address?: string;
    },
  ) {
    return this.userService.userListGet(
      payload.page,
      payload.pageSize,
      payload,
    );
  }

  // 创建用户 (需要管理员权限)
  @MessagePattern({ cmd: 'user.create' })
  async userCreate(@Payload() payload: { dto: CreateUserDto }) {
    const { profile, ...user } = payload.dto;
    await this.userService.setRoles(user as any);
    await this.userService.userCreate(user as any, profile);
    return { status: 201, message: '用户创建成功' };
  }

  // 获取单个用户信息 (需要管理员权限)
  @MessagePattern({ cmd: 'user.get' })
  async userGet(@Payload() payload: { id: number }) {
    return this.userService.userGet(payload.id);
  }

  // 删除用户 (需要管理员权限)
  @MessagePattern({ cmd: 'user.delete' })
  async userDelete(@Payload() payload: { id: number }) {
    return this.userService.userDelete(payload.id);
  }

  // 更新用户 (需要管理员权限)
  @MessagePattern({ cmd: 'user.update' })
  async userUpdate(@Payload() payload: { id: number; dto: UpdateUserDto }) {
    return this.userService.userUpdate(payload.id, payload.dto);
  }

  // 重置用户密码 (需要管理员权限)
  @MessagePattern({ cmd: 'user.password.reset' })
  async userReset(@Payload() payload: { id: number; dto: ResetPasswordDto }) {
    return this.userService.userReset(payload.id, payload.dto.password);
  }

  // 根据邮箱和用户名查找用户
  @MessagePattern({ cmd: 'user.find.byLogin' })
  async findByEmailAndUsername(@Payload() payload: { login: string }) {
    return this.userService.findByLogin(payload.login);
  }

  // 根据用户名查找用户
  @MessagePattern({ cmd: 'user.find.byUsername' })
  async findByUsername(@Payload() payload: { username: string }) {
    return this.userService.findByUsername(payload.username);
  }

  // 根据邮箱查找用户
  @MessagePattern({ cmd: 'user.find.byEmail' })
  async findByEmail(@Payload() payload: { email: string }) {
    return this.userService.findByEmail(payload.email);
  }
}
