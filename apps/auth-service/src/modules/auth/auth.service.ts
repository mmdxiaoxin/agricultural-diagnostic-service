import { User } from '@app/database/entities';
import { MailService } from '@app/mail';
import { RedisService } from '@app/redis';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { compare } from 'bcrypt';
import { USER_SERVICE_NAME } from 'config/microservice.config';
import { firstValueFrom, lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_LOGIN_ATTEMPTS = 10;
  private readonly LOCK_TIME = 1800; // 30分钟

  constructor(
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly redis: RedisService,
    @Inject(USER_SERVICE_NAME) private readonly userClient: ClientProxy,
  ) {}

  /**
   * 密码验证
   */
  private async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      if (!password || !hashedPassword) {
        throw new Error('密码验证参数不完整');
      }
      return await compare(password, hashedPassword);
    } catch (error) {
      this.logger.error(`密码验证失败: ${error.message}`, error.stack);
      throw new RpcException({
        code: 500,
        message: '密码验证失败',
      });
    }
  }

  /**
   * 用户注册
   * @param email 用户邮箱
   * @param password 用户密码
   */
  async register(email: string, password: string) {
    const userByEmail = await firstValueFrom(
      this.userClient.send({ cmd: 'user.find.byEmail' }, { email }),
    );
    if (userByEmail) {
      throw new RpcException({
        code: 400,
        message: '邮箱已被注册',
      });
    }
    const userCreationResult = await lastValueFrom(
      this.userClient.send<{ code: number; data: User; message: string }>(
        { cmd: 'user.create' },
        { email, password },
      ),
    );
    return this.jwt.sign(
      { userId: userCreationResult.data.id },
      {
        expiresIn: '30m',
      },
    );
  }

  /**
   * 用户登录
   * @param login 用户登录名（邮箱/用户名）
   * @param password 用户密码
   */
  async login(login: string, password: string) {
    try {
      // 异步检查登录限制
      const loginAttemptsCheck = this.checkLoginAttempts(login);

      // 异步获取用户信息
      const userInfoPromise = lastValueFrom(
        this.userClient.send({ cmd: 'user.find.byLogin' }, { login }),
      );

      // 等待登录限制检查完成
      await loginAttemptsCheck;

      // 获取用户信息
      const user = await userInfoPromise;

      if (!user) {
        // 异步处理登录失败
        this.handleLoginFailure(login, '账号不存在').catch((err) =>
          this.logger.error('处理登录失败时出错', err),
        );
        throw new RpcException({
          code: 400,
          message: '账号或密码错误',
        });
      }

      if (user.status === 0) {
        // 异步处理登录失败
        this.handleLoginFailure(login, '账号未激活或已被禁用').catch((err) =>
          this.logger.error('处理登录失败时出错', err),
        );
        throw new RpcException({
          code: 400,
          message: '账号未激活或已经被禁用',
        });
      }

      // 检查用户密码是否存在
      if (!user.password) {
        this.logger.error('用户密码为空', { userId: user.id, login });
        throw new RpcException({
          code: 500,
          message: '用户密码数据异常',
        });
      }

      try {
        // 直接验证密码
        const isValid = await this.verifyPassword(password, user.password);

        if (!isValid) {
          // 异步处理登录失败
          this.handleLoginFailure(login, '密码错误').catch((err) =>
            this.logger.error('处理登录失败时出错', err),
          );
          throw new RpcException({
            code: 400,
            message: '账号或密码错误',
          });
        }
      } catch (error) {
        this.logger.error('密码验证失败', {
          error: error.message,
          userId: user.id,
          login,
        });
        throw new RpcException({
          code: 500,
          message: '密码验证失败',
        });
      }

      // 生成token
      const token = this.generateToken(user);

      // 异步清除登录尝试次数
      this.clearLoginAttempts(login).catch((err) =>
        this.logger.error('清除登录尝试次数失败', err),
      );

      return token;
    } catch (error) {
      this.logger.error(`登录失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 生成访问令牌
   */
  private generateToken(user: User) {
    const payload = {
      userId: user.id,
      username: user.username,
      roles: user.roles.map((role) => role.name),
    };

    const token = this.jwt.sign(payload);

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600 * 24,
    };
  }

  /**
   * 处理登录失败
   */
  private async handleLoginFailure(login: string, reason: string) {
    await this.incrementLoginAttempts(login);
    this.logger.warn(`登录失败 - 用户: ${login}, 原因: ${reason}`);
  }

  /**
   * 限制登录尝试次数
   */
  private async checkLoginAttempts(login: string) {
    const attempts = await this.redis.get<string>(`login_attempts:${login}`);
    if (attempts && parseInt(attempts) >= this.MAX_LOGIN_ATTEMPTS) {
      throw new RpcException({
        code: 400,
        message: `登录失败次数过多，请${this.LOCK_TIME / 60}分钟后再试`,
      });
    }
  }

  /**
   * 增加登录尝试次数
   */
  private async incrementLoginAttempts(login: string) {
    const key = `login_attempts:${login}`;
    const attempts = await this.redis.increment(key);

    if (attempts === 1) {
      await this.redis.set(key, attempts, this.LOCK_TIME);
    }
  }

  /**
   * 清除登录尝试次数
   */
  private async clearLoginAttempts(login: string) {
    await this.redis.del(`login_attempts:${login}`);
  }

  /**
   * 发送账号激活通知邮件
   * @param email 用户邮箱
   * @param link 激活链接
   */
  async notifyAccount(email: string, link: string) {
    return await this.mail.sendMail(
      email,
      '邮箱验证 - 病害智能诊断系统',
      `请点击链接激活账号：${link}`,
      `
        <html>
            <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
                    <tr>
                        <td style="text-align: center; padding-bottom: 20px;">
                            <h2 style="color: #333333;">病害智能诊断系统</h2>
                            <p style="color: #777777; font-size: 16px;">感谢您使用我们的系统！</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-bottom: 20px; color: #555555; font-size: 16px;">
                            <p>为了确保您的账户安全，请点击下面的链接完成邮箱验证：</p>
                            <p style="text-align: center;">
                                <a href="${link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">点击验证邮箱</a>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="color: #777777; font-size: 14px; text-align: center;">
                            <p>此链接将在 30 分钟后过期，请尽快验证。</p>
                            <p>如果您没有请求此验证，请忽略此邮件。</p>
                        </td>
                    </tr>
                </table>
                <p style="text-align: center; color: #777777; font-size: 14px; margin-top: 20px;">© 2025 病害智能诊断系统</p>
            </body>
        </html>
    `,
    );
  }

  /**
   * 验证账号激活
   * @param token 激活Token
   */
  async verifyAccount(token: string) {
    try {
      const { userId } = this.jwt.decode(token);
      return await firstValueFrom(
        this.userClient.send({ cmd: 'user.update.activate' }, { id: userId }),
      );
    } catch (error) {
      throw new RpcException({
        code: 400,
        message: typeof error === 'string' ? error : '验证失败',
      });
    }
  }

  /**
   * 获取按钮配置
   */
  async buttonsGet() {
    return { useHooks: { add: true, delete: true } };
  }
}
