import { LoginDto } from '@common/dto/auth/login.dto';
import { RegisterDto } from '@common/dto/auth/register.dto';
import {
  ButtonsGetResponse,
  LoginRequest,
  LoginResponse,
  NotifyRequest,
  NotifyResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyRequest,
  VerifyResponse,
} from '@common/types/auth';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @MessagePattern({ cmd: 'auth.register' })
  async register(@Payload() payload: { dto: RegisterDto }) {
    const { email, password } = payload.dto;
    return this.authService.register(email, password);
  }

  @MessagePattern({ cmd: 'auth.login' })
  async login(@Payload() payload: { dto: LoginDto }) {
    const { login, password } = payload.dto;
    try {
      const result = await this.authService.login(login, password);
      return result;
    } catch (error) {
      this.logger.error(`登录处理失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  @MessagePattern({ cmd: 'auth.notify' })
  async notify(@Payload() payload: { email: string; link: string }) {
    return this.authService.notifyAccount(payload.email, payload.link);
  }

  @MessagePattern({ cmd: 'auth.verify' })
  async verify(@Payload() payload: { token: string }) {
    return this.authService.verifyAccount(payload.token);
  }

  @MessagePattern({ cmd: 'auth.buttonsGet' })
  async buttonsGet() {
    return this.authService.buttonsGet();
  }

  @GrpcMethod('AuthService', 'Register')
  async grpcRegister(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const result = await this.authService.register(data.email, data.password);
      return { success: true, message: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @GrpcMethod('AuthService', 'Login')
  async grpcLogin(data: LoginRequest): Promise<LoginResponse> {
    try {
      const result = await this.authService.login(data.login, data.password);
      return {
        token: result.access_token,
        message: '登录成功',
      };
    } catch (error) {
      this.logger.error(`gRPC登录处理失败: ${error.message}`, error.stack);
      return {
        token: '',
        message: error.message,
      };
    }
  }

  @GrpcMethod('AuthService', 'Notify')
  async grpcNotify(data: NotifyRequest): Promise<NotifyResponse> {
    try {
      await this.authService.notifyAccount(data.email, data.link);
      return { success: true, message: '邮件发送成功' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @GrpcMethod('AuthService', 'Verify')
  async grpcVerify(data: VerifyRequest): Promise<VerifyResponse> {
    try {
      await this.authService.verifyAccount(data.token);
      return { success: true, message: '验证成功' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @GrpcMethod('AuthService', 'ButtonsGet')
  async grpcButtonsGet(): Promise<ButtonsGetResponse> {
    try {
      const result = await this.authService.buttonsGet();
      return { buttons: Object.keys(result.useHooks) };
    } catch (error) {
      return { buttons: [] };
    }
  }
}
