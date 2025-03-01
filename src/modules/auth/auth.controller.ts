import { Body, Controller, Post } from '@nestjs/common';
import { RegisterDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const { email, password } = dto;
    return this.authService.register(email, password);
  }
}
