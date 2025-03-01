import { formatResponse } from '@/common/helpers/response.helper';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseFilters,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TypeormFilter } from '@/common/filters/typeorm.filter';
@Controller('auth')
@UseFilters(TypeormFilter)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    const { email, password } = dto;
    try {
      await this.authService.register(email, password);
      return formatResponse(201, null, '注册成功');
    } catch (error) {
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const { login, password } = dto;
    try {
      const token = await this.authService.login(login, password);
      return formatResponse(200, { token }, '登录成功');
    } catch (error) {
      throw error;
    }
  }
}
