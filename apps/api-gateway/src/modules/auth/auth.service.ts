import { LoginDto } from '@common/dto/auth/login.dto';
import { RegisterDto } from '@common/dto/auth/register.dto';
import { GrpcAuthService, GrpcMenuService } from '@common/types/auth';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { verifyHtml } from '@shared/constants/html';
import { formatResponse } from '@shared/helpers/response.helper';
import { AUTH_SERVICE_NAME } from 'config/microservice.config';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  private grpcAuthService: GrpcAuthService;
  private grpcMenuService: GrpcMenuService;

  constructor(@Inject(AUTH_SERVICE_NAME) private readonly client: ClientGrpc) {
    this.grpcAuthService =
      this.client.getService<GrpcAuthService>('AuthService');
    this.grpcMenuService =
      this.client.getService<GrpcMenuService>('MenuService');
  }

  async register(req: Request, dto: RegisterDto) {
    const response = await firstValueFrom(
      this.grpcAuthService.register({
        email: dto.email,
        password: dto.password,
      }),
    );

    if (!response.success) {
      throw new InternalServerErrorException(response.message);
    }

    const link = `${req.protocol}://${req.get('host')}/api/auth/verify/${response.message}`;
    const notifyResponse = await firstValueFrom(
      this.grpcAuthService.notify({ email: dto.email, link }),
    );

    if (!notifyResponse.success) {
      throw new InternalServerErrorException(notifyResponse.message);
    }

    return formatResponse(201, null, '注册成功，请查看邮箱验证');
  }

  async login(dto: LoginDto) {
    const response = await firstValueFrom(
      this.grpcAuthService.login({ login: dto.login, password: dto.password }),
    );

    if (!response.token) {
      throw new InternalServerErrorException(response.message);
    }

    return formatResponse(
      200,
      {
        access_token: response.token,
        token_type: 'Bearer',
        expires_in: 3600 * 24,
      },
      '登录成功',
    );
  }

  async logout() {
    return formatResponse(200, null, '成功退出');
  }

  async verify(token: string) {
    const response = await firstValueFrom(
      this.grpcAuthService.verify({ token }),
    );

    if (!response.success) {
      throw new InternalServerErrorException(response.message);
    }

    return verifyHtml;
  }

  async getButtons() {
    await firstValueFrom(this.grpcAuthService.buttonsGet({}));

    return formatResponse(
      200,
      { useHooks: { add: true, delete: true } },
      '获取按钮成功',
    );
  }
}
