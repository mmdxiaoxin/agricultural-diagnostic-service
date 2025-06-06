import { DatabaseModule } from '@app/database';
import { Dataset, FileEntity } from '@app/database/entities';
import { RedisModule } from '@app/redis';
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { UploadController } from './app.controller';
import { UploadService } from './app.service';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    DatabaseModule.register(),
    DatabaseModule.forFeature([FileEntity, Dataset]),
    RedisModule,
    PrometheusModule.register(),
    HealthModule,
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class AppModule {}
