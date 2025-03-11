import { AuthGuard } from '@common/guards/auth.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { formatResponse } from '@shared/helpers/response.helper';
import { AUTH_SERVICE_NAME } from 'config/microservice.config';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('权限认证模块')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE_NAME) private readonly authClient: ClientProxy,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    await firstValueFrom(
      this.authClient.send({ cmd: 'auth.register' }, { dto }),
    );
    return formatResponse(201, null, '注册成功');
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const result = await lastValueFrom(
      this.authClient.send({ cmd: 'auth.login' }, { dto }),
    );
    return formatResponse(
      200,
      { access_token: result.access_token },
      '登录成功',
    );
  }

  @Get('buttons')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async buttonsGet() {
    return formatResponse(
      200,
      { useHooks: { add: true, delete: true } },
      '获取按钮成功',
    );
  }
}
