import { Body, Controller, Post, UseFilters } from '@nestjs/common';
import { TypeormFilter } from 'src/common/filters/typeorm.filter';
import { AuthService } from './auth.service';
import { RegisterDto } from './auth.dto';

@Controller('auth')
@UseFilters(new TypeormFilter())
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const { email, password } = dto;
    return this.authService.register(email, password);
  }
}
