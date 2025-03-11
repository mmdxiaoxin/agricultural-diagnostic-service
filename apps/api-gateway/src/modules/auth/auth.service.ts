import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { formatResponse } from '@shared/helpers/response.helper';
import { AUTH_SERVICE_NAME } from 'config/microservice.config';
import { firstValueFrom, lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_SERVICE_NAME) private readonly authClient: ClientProxy,
  ) {}

  async register(email: string, password: string) {
    const newUser = await firstValueFrom(
      this.authClient.send({ cmd: 'auth.register' }, { email, password }),
    );
    return newUser;
  }

  async login(login: string, password: string) {
    const result = await lastValueFrom(
      this.authClient.send({ cmd: 'auth.login' }, { login, password }),
    );

    return formatResponse(
      200,
      { access_token: result.access_token },
      '登录成功',
    );
  }

  async buttonsGet() {
    return formatResponse(
      200,
      { useHooks: { add: true, delete: true } },
      '获取按钮成功',
    );
  }
}
