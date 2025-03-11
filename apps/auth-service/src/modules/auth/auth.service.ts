import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { compare } from 'bcryptjs';
import { USER_SERVICE_NAME } from 'config/microservice.config';
import { firstValueFrom, lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    @Inject(USER_SERVICE_NAME) private readonly userClient: ClientProxy,
  ) {}

  async register(email: string, password: string) {
    const user = await firstValueFrom(
      this.userClient.send({ cmd: 'user.find.byEmail' }, email),
    );
    if (user) {
      throw new ForbiddenException('用户已存在');
    }
    const newUser = await lastValueFrom(
      this.userClient.send({ cmd: 'user.create' }, { email, password }),
    );
    return newUser;
  }

  async login(login: string, password: string) {
    const user = await firstValueFrom(
      this.userClient.send({ cmd: 'user.find.byLogin' }, { login }),
    );
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

    return {
      access_token: this.jwt.sign({
        userId: user.id,
        username: user.username,
        roles: user.roles.map((role) => role.name),
      }),
    };
  }

  async buttonsGet() {
    return { useHooks: { add: true, delete: true } };
  }
}
