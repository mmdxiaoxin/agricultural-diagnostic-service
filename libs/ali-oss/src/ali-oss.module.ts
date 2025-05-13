import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AliOssService } from './ali-oss.service';
import aliOssConfig from './ali-oss.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ConfigModule.forFeature(aliOssConfig),
  ],
  providers: [AliOssService],
  exports: [AliOssService],
})
export class AliOssModule {}
