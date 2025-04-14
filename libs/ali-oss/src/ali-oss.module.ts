import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AliOssService } from './ali-oss.service';
import aliOssConfig from './ali-oss.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env',
        `.env.${process.env.NODE_ENV || 'development'}.local`,
      ],
    }),
    ConfigModule.forFeature(aliOssConfig),
  ],
  providers: [AliOssService],
  exports: [AliOssService],
})
export class AliOssModule {}
