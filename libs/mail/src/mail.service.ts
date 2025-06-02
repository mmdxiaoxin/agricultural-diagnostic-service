import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigEnum } from '@shared/enum/config.enum';
import * as nodemailer from 'nodemailer';
import { mailConfigSchema, type MailConfig } from './schemas/mail.schema';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const config = {
      host: this.configService.get<string>(ConfigEnum.MAIL_HOST),
      port: Number(this.configService.get<string>(ConfigEnum.MAIL_PORT)),
      secure: this.configService.get<string>(ConfigEnum.MAIL_SECURE) === 'true',
      auth: {
        user: this.configService.get<string>(ConfigEnum.MAIL_USER),
        pass: this.configService.get<string>(ConfigEnum.MAIL_PASS),
      },
      from: this.configService.get<string>(ConfigEnum.MAIL_FROM),
    } as MailConfig;

    // 验证配置
    const validatedConfig = mailConfigSchema.parse(config);

    this.transporter = nodemailer.createTransport({
      host: validatedConfig.host,
      port: validatedConfig.port,
      secure: validatedConfig.secure,
      auth: validatedConfig.auth,
    });
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `"${this.configService.get<string>(ConfigEnum.MAIL_FROM)}" <${this.configService.get<string>(ConfigEnum.MAIL_USER)}>`,
        to,
        subject,
        text,
        html,
      });
      console.log('Message sent: %s', info.messageId);
      return { code: 200, message: '邮件发送成功', data: info.messageId };
    } catch (error) {
      console.error('邮件发送失败:', error);
      return { code: 500, message: '邮件发送失败', data: error };
    }
  }
}
