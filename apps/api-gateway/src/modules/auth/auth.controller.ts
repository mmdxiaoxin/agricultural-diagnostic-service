import {
  ApiErrorResponse,
  ApiResponse,
  ApiNullResponse,
} from '@common/decorator/api-response.decorator';
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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';

// 定义响应模型
class UserResponse {
  id: number;
  username: string;
  email: string;
  roles: string[];
  createdAt?: string;
}

class LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  sessionId: string;
}

class ButtonResponse {
  id: number;
  name: string;
  description: string;
  code: string;
}

@ApiTags('权限认证模块')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '用户注册', description: '创建新用户账号' })
  @ApiResponse(HttpStatus.CREATED, '注册成功', UserResponse)
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, '请求参数错误')
  async register(@Req() req: Request, @Body() dto: RegisterDto) {
    return this.authService.register(req, dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '用户登录',
    description: '使用用户名和密码登录系统',
  })
  @ApiResponse(HttpStatus.OK, '登录成功', LoginResponse)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '用户名或密码错误')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登出', description: '退出当前登录状态' })
  @ApiNullResponse(HttpStatus.OK, '登出成功')
  @ApiBearerAuth()
  async logout() {
    return this.authService.logout();
  }

  @Get('verify/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '验证令牌', description: '验证用户令牌的有效性' })
  @ApiResponse(HttpStatus.OK, '令牌有效', UserResponse)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '令牌无效或已过期')
  async verify(@Param('token') token: string) {
    return this.authService.verify(token);
  }

  @Get('buttons')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '获取按钮权限',
    description: '获取当前用户的按钮权限列表',
  })
  @ApiResponse(HttpStatus.OK, '获取成功', ButtonResponse, true)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, '未授权访问')
  @ApiBearerAuth()
  async buttonsGet() {
    return this.authService.getButtons();
  }
}
