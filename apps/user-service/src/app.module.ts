import { DatabaseModule } from '@app/database';
import { MetricsModule } from '@app/metrics';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RoleModule } from './modules/role/role.module';
import { UserModule } from './modules/user/user.module';

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
    UserModule,
    RoleModule,
    MetricsModule,
  ],
})
export class AppModule {}
