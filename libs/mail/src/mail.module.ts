import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 让配置全局可用
      envFilePath: [
        '.env',
        `.env.${process.env.NODE_ENV || 'development'}.local`,
      ],
    }),
    MailModule,
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
