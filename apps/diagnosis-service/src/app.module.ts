import { DatabaseModule } from '@app/database';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigEnum } from '@shared/enum/config.enum';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { DiagnosisModule } from './modules/diagnosis/diagnosis.module';
import { RemoteServiceModule } from './modules/remote/remote.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule.register(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get(ConfigEnum.REDIS_HOST),
          port: configService.get(ConfigEnum.REDIS_PORT),
          password: configService.get(ConfigEnum.REDIS_PASSWORD),
          db: configService.get(ConfigEnum.REDIS_DB),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      }),
      inject: [ConfigService],
    }),
    RemoteServiceModule,
    DiagnosisModule,
    PrometheusModule.register(),
  ],
})
export class AppModule {}
