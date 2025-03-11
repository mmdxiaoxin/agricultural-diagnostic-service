import { TypeormFilter } from '@common/filters/typeorm.filter';
import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
@UseFilters(TypeormFilter)
export class AuthController {
  constructor(private authService: AuthService) {}

  @MessagePattern({ cmd: 'auth.register' })
  async register(@Payload() dto: RegisterDto) {
    const { email, password } = dto;
    return this.authService.register(email, password);
  }

  @MessagePattern({ cmd: 'auth.login' })
  async login(@Payload() dto: LoginDto) {
    const { login, password } = dto;
    return this.authService.login(login, password);
  }

  @MessagePattern({ cmd: 'auth.buttonsGet' })
  async buttonsGet() {
    return this.authService.buttonsGet();
  }
}
