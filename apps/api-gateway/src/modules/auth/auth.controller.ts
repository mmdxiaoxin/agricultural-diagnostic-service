import { AuthGuard } from '@common/guards/auth.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { formatResponse } from '@shared/helpers/response.helper';
import { AUTH_SERVICE_NAME } from 'config/microservice.config';
import { Request } from 'express';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { verifyHtml } from '@shared/constants/html';

@ApiTags('权限认证模块')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE_NAME) private readonly authClient: ClientProxy,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Req() req: Request, @Body() dto: RegisterDto) {
    const token = await firstValueFrom(
      this.authClient.send({ cmd: 'auth.register' }, { dto }),
    );
    const link = `${req.protocol}://${req.get('host')}/auth/verify/${token}`;
    await firstValueFrom(
      this.authClient.send({ cmd: 'auth.notify' }, { email: dto.email, link }),
    );
    return formatResponse(201, null, '注册成功，请查看邮箱验证');
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

  @Post('verify/:token')
  @HttpCode(HttpStatus.OK)
  async verify(@Param('token') token: string) {
    await lastValueFrom(
      this.authClient.send({ cmd: 'auth.verify' }, { token }),
    );
    return verifyHtml;
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
