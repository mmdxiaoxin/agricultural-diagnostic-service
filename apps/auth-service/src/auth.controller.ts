import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EventPattern } from '@nestjs/microservices';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @EventPattern('login')
  async login(data: { login: string; password: string }) {
    return this.authService.login(data.login, data.password);
  }

  @EventPattern('register')
  async register(data: { email: string; password: string }) {
    return this.authService.register(data.email, data.password);
  }
}
