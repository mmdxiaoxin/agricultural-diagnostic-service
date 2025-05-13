import { DatabaseModule } from '@app/database';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { DatasetModule } from './modules/dataset/dataset.module';
import { FileModule } from './modules/file/file.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule.register(),
    FileModule,
    DatasetModule,
    PrometheusModule.register(),
  ],
})
export class AppModule {}
