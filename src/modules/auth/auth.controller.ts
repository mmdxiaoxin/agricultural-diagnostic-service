import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from 'src/common/dto/auth.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 注册
  @Post('register')
  async registerUser(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // 登录
  @Post('login')
  async loginUser(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // 激活
  @Get('verify/:token')
  async verifyUser(@Param('token') token: string) {
    return this.authService.verify(token);
  }

  // 获取角色字典（需要认证）
  @Get('role-dict')
  @UseGuards(AuthGuard) // 使用守卫进行权限检查
  async getRoleDict() {
    return this.authService.getRoleDict();
  }

  // 获取按钮权限（需要认证）
  @Get('buttons')
  @UseGuards(AuthGuard)
  async getButtons() {
    return this.authService.getButtons();
  }

  // 获取路由信息（需要认证）
  @Get('route')
  @UseGuards(AuthGuard)
  async getRoute() {
    return this.authService.getRoute();
  }
}
