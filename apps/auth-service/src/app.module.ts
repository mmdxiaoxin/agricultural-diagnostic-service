import { DatabaseModule } from '@app/database';
import { MetricsModule } from '@app/metrics';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { MenuModule } from './modules/menu/menu.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env',
        `.env.${process.env.NODE_ENV || 'development'}.local`,
      ],
    }),
    DatabaseModule.register(),
    AuthModule,
    MenuModule,
    MetricsModule,
  ],
})
export class AppModule {}
