import { DatabaseModule } from '@app/database';
import { Dataset, FileEntity } from '@app/database/entities';
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { DownloadController } from './app.controller';
import { DownloadService } from './app.service';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    DatabaseModule.register(),
    DatabaseModule.forFeature([FileEntity, Dataset]),
    PrometheusModule.register(),
    HealthModule,
  ],
  controllers: [DownloadController],
  providers: [DownloadService],
})
export class AppModule {}
