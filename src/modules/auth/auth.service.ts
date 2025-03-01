import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, RegisterDto } from 'src/common/dto/auth.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  // 注册用户
  async register(registerDto: RegisterDto) {
    const user = await this.userService.create(registerDto);
    return { message: 'User registered successfully', code: 201 };
  }

  // 登录
  async login(loginDto: LoginDto) {
    try {
      const user = await this.userService.validateUser(loginDto);
      const payload = {
        username: user.username,
        userId: user.id,
        roleId: user.role_id,
      };
      return {
        token: this.jwtService.sign(payload),
      };
    } catch (error) {}
  }

  // 验证用户
  async verify(token: string) {
    // 验证 Token 并返回相应结果
    return { message: 'User verified successfully' };
  }

  // 获取角色字典
  async getRoleDict() {
    return {
      roles: ['admin', 'user', 'guest'],
    };
  }

  // 获取按钮权限
  async getButtons() {
    return {
      buttons: ['create', 'edit', 'delete'],
    };
  }

  // 获取路由信息
  async getRoute() {
    return {
      routes: ['/dashboard', '/settings', '/profile'],
    };
  }

  // 生成 Token
  generateToken(data) {
    return this.jwtService.sign(data);
  }

  // 校验 Token
  verifyToken(token) {
    if (!token) return '';

    return this.jwtService.verify(token);
  }
}
