import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigEnum } from '@shared/enum/config.enum';
import * as redisStore from 'cache-manager-redis-store';
import { RedisService } from './redis.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: [
            '.env',
            `.env.${process.env.NODE_ENV || 'development'}.local`,
          ],
        }),
      ],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          store: redisStore,
          host: configService.get(ConfigEnum.REDIS_HOST),
          port: configService.get(ConfigEnum.REDIS_PORT),
          db: 0, //目标库,
        };
      },
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
