import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { LoginDto, RegisterDto } from './auth.dto';
import { AuthService } from './auth.service';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    const { email, password } = dto;
    this.authService.register(email, password);
    return {
      code: 201,
      data: null,
      message: '注册成功',
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const { login, password } = dto;
    const token = await this.authService.login(login, password);
    return {
      code: 200,
      data: { token },
      message: '登录成功',
    };
  }
}
