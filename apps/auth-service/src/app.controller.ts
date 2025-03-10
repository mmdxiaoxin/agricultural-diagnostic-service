import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly authService: AppService) {}

  @MessagePattern('login')
  async login(data: { login: string; password: string }) {
    return this.authService.login(data.login, data.password);
  }

  @MessagePattern('register')
  async register(data: { email: string; password: string }) {
    return this.authService.register(data.email, data.password);
  }
}
