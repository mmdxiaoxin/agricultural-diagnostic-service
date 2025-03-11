import { MailService } from '@app/mail';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { compare } from 'bcryptjs';
import { USER_SERVICE_NAME } from 'config/microservice.config';
import { firstValueFrom, lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private mail: MailService,
    @Inject(USER_SERVICE_NAME) private readonly userClient: ClientProxy,
  ) {}

  async register(email: string, password: string) {
    const result = await firstValueFrom(
      this.userClient.send({ cmd: 'user.find.byEmail' }, { email }),
    );
    if (result) {
      throw new RpcException({
        code: 400,
        message: '邮箱已被注册',
      });
    }
    const newUser = await lastValueFrom(
      this.userClient.send({ cmd: 'user.create' }, { email, password }),
    );
    return this.jwt.sign(
      { userId: newUser.id },
      {
        expiresIn: '30m',
      },
    );
  }

  async login(login: string, password: string) {
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
      throw new RpcException({
        code: 400,
        message: '账号或密码错误',
      });
    }

    return {
      access_token: this.jwt.sign({
        userId: user.id,
        username: user.username,
        roles: user.roles.map((role) => role.name),
      }),
    };
  }

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
            </body>
        </html>
    `,
    );
  }

  async verifyAccount(token: string) {
    try {
      const { userId } = this.jwt.decode(token);
      return await firstValueFrom(
        this.userClient.send({ cmd: 'user.activate' }, { id: userId }),
      );
    } catch (error) {
      throw new RpcException({
        code: 400,
        message: '验证失败',
      });
    }
  }

  async buttonsGet() {
    return { useHooks: { add: true, delete: true } };
  }
}
