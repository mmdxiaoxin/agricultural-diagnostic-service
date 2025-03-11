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
  @MessagePattern('user.profile.get')
  async profileGet(@Payload() userId: number) {
    return this.userService.profileGet(userId);
  }

  // 更新个人信息
  @MessagePattern('user.profile.update')
  async profileUpdate(
    @Payload() data: { userId: number; dto: UpdateProfileDto },
  ) {
    return this.userService.profileUpdate(data.userId, data.dto);
  }

  // 上传个人头像
  @MessagePattern('user.avatar.upload')
  async uploadAvatar(
    @Payload() data: { userId: number; file: Express.Multer.File },
  ) {
    return this.userService.updateAvatar(data.userId, data.file);
  }

  // 获取个人头像路径
  @MessagePattern('user.avatar.get')
  async getAvatar(@Payload() userId: number) {
    return this.userService.getAvatar(userId);
  }

  // 修改密码
  @MessagePattern('user.password.update')
  async updatePassword(
    @Payload() data: { userId: number; dto: UpdatePasswordDto },
  ) {
    return this.userService.updatePassword(
      data.userId,
      data.dto.confirmPassword,
    );
  }

  // 退出登陆
  @MessagePattern('user.logout')
  async logout() {
    return { status: 200, message: '退出登录成功' };
  }

  // 获取用户列表 (需要管理员权限)
  @MessagePattern('user.list.get')
  async userListGet(
    @Payload()
    filters: {
      page?: number;
      pageSize?: number;
      username?: string;
      name?: string;
      phone?: string;
      address?: string;
    },
  ) {
    return this.userService.userListGet(
      filters.page,
      filters.pageSize,
      filters,
    );
  }

  // 创建用户 (需要管理员权限)
  @MessagePattern('user.create')
  async userCreate(@Payload() createUserDto: CreateUserDto) {
    const { profile, ...user } = createUserDto;
    await this.userService.setRoles(user as any);
    await this.userService.userCreate(user as any, profile);
    return { status: 201, message: '用户创建成功' };
  }

  // 获取单个用户信息 (需要管理员权限)
  @MessagePattern('user.get')
  async userGet(@Payload() id: number) {
    return this.userService.userGet(id);
  }

  // 删除用户 (需要管理员权限)
  @MessagePattern('user.delete')
  async userDelete(@Payload() id: number) {
    return this.userService.userDelete(id);
  }

  // 更新用户 (需要管理员权限)
  @MessagePattern('user.update')
  async userUpdate(@Payload() data: { id: number; dto: UpdateUserDto }) {
    return this.userService.userUpdate(data.id, data.dto);
  }

  // 重置用户密码 (需要管理员权限)
  @MessagePattern('user.password.reset')
  async userReset(@Payload() data: { id: number; dto: ResetPasswordDto }) {
    return this.userService.userReset(data.id, data.dto.password);
  }
}
