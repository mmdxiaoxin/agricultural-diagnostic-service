import { UpdatePasswordDto } from '@common/dto/user/change-pass.dto';
import { CreateUserDto } from '@common/dto/user/create-user.dto';
import { ResetPasswordDto } from '@common/dto/user/reset-pass.dto';
import { UpdateProfileDto } from '@common/dto/user/update-profile.dto';
import { UpdateUserStatusDto } from '@common/dto/user/update-user-status.dto';
import { UpdateUserDto } from '@common/dto/user/update-user.dto';
import { UserPageQueryDto } from '@common/dto/user/user-page-query.dto';
import {
  Inject,
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { USER_SERVICE_NAME } from 'config/microservice.config';
import { Response } from 'express';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
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
    try {
      const result = await lastValueFrom(
        this.userClient.send({ cmd: 'user.avatar.get' }, { userId }),
      );

      if (!result.data) {
        return result;
      }

      const { avatar, fileName, mimeType } = result.data;

      // 设置响应头
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24小时缓存

      // 直接发送 base64 解码后的 buffer
      res.send(Buffer.from(avatar, 'base64'));
    } catch (error) {
      this.logger.error(`获取头像失败: ${error.message}`, error.stack);
      throw new HttpException('获取头像失败', HttpStatus.INTERNAL_SERVER_ERROR);
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
