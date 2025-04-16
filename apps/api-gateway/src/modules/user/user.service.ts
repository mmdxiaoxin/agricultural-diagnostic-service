import { UpdatePasswordDto } from '@common/dto/user/change-pass.dto';
import { CreateUserDto } from '@common/dto/user/create-user.dto';
import { ResetPasswordDto } from '@common/dto/user/reset-pass.dto';
import { UpdateProfileDto } from '@common/dto/user/update-profile.dto';
import { UpdateUserStatusDto } from '@common/dto/user/update-user-status.dto';
import { UpdateUserDto } from '@common/dto/user/update-user.dto';
import { UserPageQueryDto } from '@common/dto/user/user-page-query.dto';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { USER_SERVICE_NAME } from 'config/microservice.config';
import { Response } from 'express';
import { lastValueFrom } from 'rxjs';

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

  updatePassword(userId: number, dto: UpdatePasswordDto) {
    return this.userClient.send(
      { cmd: 'user.password.update' },
      { userId, dto },
    );
  }

  getUserList(query: UserPageQueryDto) {
    return this.userClient.send({ cmd: 'user.get.list' }, query);
  }

  createUser(dto: CreateUserDto) {
    return this.userClient.send({ cmd: 'user.create' }, dto);
  }

  getUser(id: number) {
    return this.userClient.send({ cmd: 'user.get' }, { id });
  }

  deleteUser(id: number) {
    return this.userClient.send({ cmd: 'user.delete' }, { id });
  }

  updateUser(id: number, dto: UpdateUserDto) {
    return this.userClient.send({ cmd: 'user.update' }, { id, dto });
  }

  updateUserStatus(id: number, dto: UpdateUserStatusDto) {
    return this.userClient.send({ cmd: 'user.status.update' }, { id, dto });
  }

  resetUserPassword(id: number, dto: ResetPasswordDto) {
    return this.userClient.send({ cmd: 'user.password.reset' }, { id, dto });
  }
}
