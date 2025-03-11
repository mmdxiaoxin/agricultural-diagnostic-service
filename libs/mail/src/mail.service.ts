import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigEnum } from '@shared/enum/config.enum';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>(
        ConfigEnum.MAIL_HOST,
        'smtp.example.com',
      ),
      port: this.configService.get<number>(ConfigEnum.MAIL_PORT, 465),
      secure: this.configService.get<boolean>(ConfigEnum.MAIL_SECURE, true),
      auth: {
        user: this.configService.get<string>(ConfigEnum.MAIL_USER),
        pass: this.configService.get<string>(ConfigEnum.MAIL_PASS),
      },
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
