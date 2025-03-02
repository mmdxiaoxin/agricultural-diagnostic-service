import { TypeormFilter } from '@/common/filters/typeorm.filter';
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
@Controller('auth')
@UseFilters(TypeormFilter)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    const { email, password } = dto;
    return this.authService.register(email, password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const { login, password } = dto;
    return this.authService.login(login, password);
  }

  @Post('buttons')
  @HttpCode(HttpStatus.OK)
  async buttonsGet(@Body() dto: LoginDto) {
    return this.authService.buttonsGet();
  }
}
