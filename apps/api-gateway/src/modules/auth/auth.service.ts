import { LoginDto } from '@common/dto/auth/login.dto';
import { RegisterDto } from '@common/dto/auth/register.dto';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { verifyHtml } from '@shared/constants/html';
import { formatResponse } from '@shared/helpers/response.helper';
import { AUTH_SERVICE_NAME } from 'config/microservice.config';
import { Request } from 'express';
import { firstValueFrom, lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_SERVICE_NAME) private readonly authClient: ClientProxy,
  ) {}

  async register(req: Request, dto: RegisterDto) {
    const token = await lastValueFrom(
      this.authClient.send({ cmd: 'auth.register' }, { dto }),
    );
    const link = `${req.protocol}://${req.get('host')}/auth/verify/${token}`;
    await firstValueFrom(
      this.authClient.send({ cmd: 'auth.notify' }, { email: dto.email, link }),
    );
    return formatResponse(201, null, '注册成功，请查看邮箱验证');
  }

  async login(dto: LoginDto) {
    const result = await lastValueFrom(
      this.authClient.send({ cmd: 'auth.login' }, { dto }),
    );
    return formatResponse(
      200,
      { access_token: result.access_token },
      '登录成功',
    );
  }

  async logout() {
    return formatResponse(200, null, '成功退出');
  }

  async verify(token: string) {
    await lastValueFrom(
      this.authClient.send({ cmd: 'auth.verify' }, { token }),
    );
    return verifyHtml;
  }

  async getButtons() {
    return formatResponse(
      200,
      { useHooks: { add: true, delete: true } },
      '获取按钮成功',
    );
  }
}
