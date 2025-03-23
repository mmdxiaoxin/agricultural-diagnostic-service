import { User } from '@app/database/entities';
import { MailService } from '@app/mail';
import { RedisService } from '@app/redis';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { compare } from 'bcryptjs';
import { USER_SERVICE_NAME } from 'config/microservice.config';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly redis: RedisService,
    @Inject(USER_SERVICE_NAME) private readonly userClient: ClientProxy,
  ) {}

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
    // 限制频繁登录
    await this.checkLoginAttempts(login);

    const user = await firstValueFrom(
      this.userClient.send({ cmd: 'user.find.byLogin' }, { login }),
    );
    if (!user) {
      throw new RpcException({
        code: 400,
        message: '账号或密码错误',
      });
    }
    if (user.status === 0) {
      throw new RpcException({
        code: 400,
        message: '账号未激活或已经被禁用',
      });
    }

    const isValid = await compare(password, user.password);
    if (!isValid) {
      // 密码错误，增加登录尝试次数
      await this.incrementLoginAttempts(login);
      throw new RpcException({
        code: 400,
        message: '账号或密码错误',
      });
    }

    // 登录成功，清除登录尝试次数
    await this.clearLoginAttempts(login);

    const sessionId = uuidv4();
    await this.redis.storeSession(user.id.toString(), sessionId, 3600); // 存储会话到 Redis 中

    return {
      access_token: this.jwt.sign({
        userId: user.id,
        username: user.username,
        roles: user.roles.map((role) => role.name),
      }),
      sessionId,
    };
  }

  /**
   * 限制登录尝试次数
   * @param login 用户名或邮箱
   */
  private async checkLoginAttempts(login: string) {
    const attempts = await this.redis.getSession(`login_attempts:${login}`);
    if (attempts && parseInt(attempts) >= 5) {
      throw new RpcException({
        code: 400,
        message: '登录失败次数过多，请稍后再试',
      });
    }
  }

  /**
   * 增加登录尝试次数
   * @param login 用户名或邮箱
   */
  private async incrementLoginAttempts(login: string) {
    await this.redis.increment(`login_attempts:${login}`);
  }

  /**
   * 清除登录尝试次数
   * @param login 用户名或邮箱
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
