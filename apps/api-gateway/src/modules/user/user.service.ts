import { UpdatePasswordDto } from '@common/dto/user/change-pass.dto';
import { CreateUserDto } from '@common/dto/user/create-user.dto';
import { ResetPasswordDto } from '@common/dto/user/reset-pass.dto';
import { UpdateProfileDto } from '@common/dto/user/update-profile.dto';
import { UpdateUserDto } from '@common/dto/user/update-user.dto';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { formatResponse } from '@shared/helpers/response.helper';
import { USER_SERVICE_NAME } from 'config/microservice.config';
import { Response } from 'express';
import { lastValueFrom } from 'rxjs';
import { defaultIfEmpty } from 'rxjs/operators';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_SERVICE_NAME) private readonly userClient: ClientProxy,
  ) {}

  getProfile(userId: number) {
    return this.userClient.send({ cmd: 'user.profile.get' }, { userId });
  }

  updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    return this.userClient.send(
      { cmd: 'user.profile.update' },
      { userId, dto: updateProfileDto },
    );
  }

  uploadAvatar(userId: number, file: Express.Multer.File) {
    return this.userClient.send(
      { cmd: 'user.avatar.upload' },
      {
        userId,
        fileData: file.buffer.toString('base64'),
        mimetype: file.mimetype,
      },
    );
  }

  async getAvatar(userId: number, res: Response) {
    const result = await lastValueFrom(
      this.userClient.send({ cmd: 'user.avatar.get' }, { userId }),
    );

    if (result.data) {
      const { avatar, fileName, mimeType } = result.data;
      const avatarBuffer = Buffer.from(avatar, 'base64');

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );
      res.setHeader('Content-Type', mimeType);

      res.send(avatarBuffer);
    } else {
      res.status(404).send('Avatar not found.');
    }
  }

  async updatePassword(userId: number, updatePasswordDto: UpdatePasswordDto) {
    const payload = { userId, dto: updatePasswordDto };
    await lastValueFrom(
      this.userClient
        .send({ cmd: 'user.password.update' }, payload)
        .pipe(defaultIfEmpty(null)),
    );
    return formatResponse(200, null, '修改密码成功');
  }

  async logout() {
    await lastValueFrom(
      this.userClient
        .send({ cmd: 'user.logout' }, {})
        .pipe(defaultIfEmpty(null)),
    );
    return formatResponse(200, null, '退出登录成功');
  }

  async getUserList(query: any) {
    const result = await lastValueFrom(
      this.userClient.send({ cmd: 'user.list.get' }, query),
    );
    return formatResponse(200, result, '获取用户列表成功');
  }

  async createUser(createUserDto: CreateUserDto) {
    await lastValueFrom(
      this.userClient
        .send({ cmd: 'user.create' }, createUserDto)
        .pipe(defaultIfEmpty(null)),
    );
    return formatResponse(201, null, '创建用户成功');
  }

  async getUser(id: number) {
    const result = await lastValueFrom(
      this.userClient.send({ cmd: 'user.get' }, { id }),
    );
    return formatResponse(200, result, '获取用户信息成功');
  }

  async deleteUser(id: number) {
    return this.userClient
      .send({ cmd: 'user.delete' }, { id })
      .pipe(defaultIfEmpty(null));
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    const payload = { id, dto: updateUserDto };
    await lastValueFrom(
      this.userClient
        .send({ cmd: 'user.update' }, payload)
        .pipe(defaultIfEmpty(null)),
    );
    return formatResponse(200, null, '更新用户信息成功');
  }

  async resetUserPassword(id: number, resetPasswordDto: ResetPasswordDto) {
    const payload = { id, dto: resetPasswordDto };
    await lastValueFrom(
      this.userClient
        .send({ cmd: 'user.password.reset' }, payload)
        .pipe(defaultIfEmpty(null)),
    );
    return formatResponse(200, null, '重置用户密码成功');
  }
}
