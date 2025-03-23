import { LoginDto } from '@common/dto/auth/login.dto';
import { RegisterDto } from '@common/dto/auth/register.dto';
import { AuthGuard } from '@common/guards/auth.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';

@ApiTags('权限认证模块')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Req() req: Request, @Body() dto: RegisterDto) {
    return this.authService.register(req, dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    return this.authService.logout();
  }

  @Post('verify/:token')
  @HttpCode(HttpStatus.OK)
  async verify(@Param('token') token: string) {
    return this.authService.verify(token);
  }

  @Get('buttons')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async buttonsGet() {
    return this.authService.getButtons();
  }
}
