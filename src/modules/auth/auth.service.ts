import { formatResponse } from '@/common/helpers/response.helper';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwt: JwtService,
  ) {}

  async register(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (user) {
      throw new ForbiddenException('用户已存在');
    }
    await this.usersService.userCreate({ email, password });
    return formatResponse(201, null, '注册成功');
  }

  async login(login: string, password: string) {
    const user = await this.usersService.findByLogin(login);
    if (!user) {
      throw new ForbiddenException('账号或密码错误');
    }
    if (user.status === 0) {
      throw new ForbiddenException('账号未激活或已经被禁用');
    }
    const isValid = await compare(password, user.password);
    if (!isValid) {
      throw new ForbiddenException('账号或密码错误');
    }

    return formatResponse(
      200,
      {
        access_token: this.jwt.sign({
          userId: user.id,
          username: user.username,
          roles: user.roles?.map((role) => role.name),
        }),
      },
      '登录成功',
    );
  }
}
