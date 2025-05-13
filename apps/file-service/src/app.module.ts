import { DatabaseModule } from '@app/database';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { DatasetModule } from './modules/dataset/dataset.module';
import { FileModule } from './modules/file/file.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule.register(),
    FileModule,
    DatasetModule,
    PrometheusModule.register(),
    HealthModule,
  ],
})
export class AppModule {}
