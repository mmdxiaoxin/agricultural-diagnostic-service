import {
  ActivateUserRequest,
  CreateUserRequest,
  DeleteUserRequest,
  FindByEmailRequest,
  FindByLoginRequest,
  FindByUsernameRequest,
  GetAvatarRequest,
  GetProfileRequest,
  GetUserListRequest,
  GetUserRequest,
  ResetUserPasswordRequest,
  UpdatePasswordRequest,
  UpdateProfileRequest,
  UpdateUserRequest,
  UpdateUserStatusRequest,
  UploadAvatarRequest,
} from '@common/types/user';
import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { formatResponse } from '@shared/helpers/response.helper';
import { UserService } from './user.service';

/**
 * 用户模块 gRPC 控制器
 */
@Controller()
export class UserGrpcController {
  constructor(private readonly userService: UserService) {}

  @GrpcMethod('UserService', 'GetProfile')
  async getProfile(data: GetProfileRequest) {
    const result = await this.userService.profileGet(data.userId);
    return { response: formatResponse(200, result, '获取个人信息成功') };
  }

  @GrpcMethod('UserService', 'UpdateProfile')
  async updateProfile(data: UpdateProfileRequest) {
    if (!data.profile) {
      throw new RpcException({
        code: 400,
        message: '个人信息不能为空',
      });
    }
    const result = await this.userService.profileUpdate(
      data.userId,
      data.profile,
    );
    return { response: formatResponse(200, result, '更新个人信息成功') };
  }

  @GrpcMethod('UserService', 'UploadAvatar')
  async uploadAvatar(data: UploadAvatarRequest) {
    const result = await this.userService.updateAvatar(
      data.userId,
      Buffer.from(data.fileData),
      data.mimetype,
    );
    return { response: formatResponse(200, result, '上传头像成功') };
  }

  @GrpcMethod('UserService', 'GetAvatar')
  async getAvatar(data: GetAvatarRequest) {
    const result = await this.userService.getAvatar(data.userId);
    return { response: formatResponse(200, result, '获取头像成功') };
  }

  @GrpcMethod('UserService', 'UpdatePassword')
  async updatePassword(data: UpdatePasswordRequest) {
    const result = await this.userService.updatePassword(
      data.userId,
      data.confirmPassword,
    );
    return { response: formatResponse(200, result, '修改密码成功') };
  }

  @GrpcMethod('UserService', 'GetUserList')
  async getUserList(data: GetUserListRequest) {
    const result = await this.userService.userListGet({
      page: data.pagination?.page || 1,
      pageSize: data.pagination?.pageSize || 10,
      username: data.username,
      name: data.name,
      phone: data.phone,
      address: data.address,
    });
    return { response: formatResponse(200, result, '获取用户列表成功') };
  }

  @GrpcMethod('UserService', 'CreateUser')
  async createUser(data: CreateUserRequest) {
    if (!data.user) {
      throw new RpcException({
        code: 400,
        message: '用户信息不能为空',
      });
    }
    // @ts-ignore
    const result = await this.userService.userCreate(data.user, data.profile);
    return { response: formatResponse(201, result, '创建用户成功') };
  }

  @GrpcMethod('UserService', 'GetUser')
  async getUser(data: GetUserRequest) {
    const result = await this.userService.userGet(data.id);
    return { response: formatResponse(200, result, '获取用户信息成功') };
  }

  @GrpcMethod('UserService', 'DeleteUser')
  async deleteUser(data: DeleteUserRequest) {
    const result = await this.userService.userDelete(data.id);
    return { response: formatResponse(204, result, '删除用户成功') };
  }

  @GrpcMethod('UserService', 'UpdateUser')
  async updateUser(data: UpdateUserRequest) {
    if (!data.user) {
      throw new RpcException({
        code: 400,
        message: '用户信息不能为空',
      });
    }
    // @ts-ignore
    const result = await this.userService.userUpdate(data.id, data.user);
    return { response: formatResponse(200, result, '更新用户成功') };
  }

  @GrpcMethod('UserService', 'UpdateUserStatus')
  async updateUserStatus(data: UpdateUserStatusRequest) {
    const result = await this.userService.userStatusUpdate(data.id, {
      status: data.status,
    });
    return { response: formatResponse(200, result, '更新用户状态成功') };
  }

  @GrpcMethod('UserService', 'ActivateUser')
  async activateUser(data: ActivateUserRequest) {
    const result = await this.userService.userActivate(data.id);
    return { response: formatResponse(200, result, '激活用户成功') };
  }

  @GrpcMethod('UserService', 'ResetUserPassword')
  async resetUserPassword(data: ResetUserPasswordRequest) {
    const result = await this.userService.userReset(data.id, data.password);
    return { response: formatResponse(200, result, '重置密码成功') };
  }

  @GrpcMethod('UserService', 'FindByLogin')
  async findByLogin(data: FindByLoginRequest) {
    const result = await this.userService.findByLogin(data.login);
    return { response: formatResponse(200, result, '查找用户成功') };
  }

  @GrpcMethod('UserService', 'FindByUsername')
  async findByUsername(data: FindByUsernameRequest) {
    const result = await this.userService.findByUsername(data.username);
    return { response: formatResponse(200, result, '查找用户成功') };
  }

  @GrpcMethod('UserService', 'FindByEmail')
  async findByEmail(data: FindByEmailRequest) {
    const result = await this.userService.findByEmail(data.email);
    return { response: formatResponse(200, result, '查找用户成功') };
  }
}
