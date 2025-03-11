import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @MessagePattern({ cmd: 'auth.register' })
  async register(@Payload() payload: { dto: RegisterDto }) {
    const { email, password } = payload.dto;
    return this.authService.register(email, password);
  }

  @MessagePattern({ cmd: 'auth.login' })
  async login(@Payload() payload: { dto: LoginDto }) {
    const { login, password } = payload.dto;
    return this.authService.login(login, password);
  }

  @MessagePattern({ cmd: 'auth.verify' })
  async verify(@Payload() payload: { token: string }) {
    return this.authService.verify(payload.token);
  }

  @MessagePattern({ cmd: 'auth.buttonsGet' })
  async buttonsGet() {
    return this.authService.buttonsGet();
  }
}
