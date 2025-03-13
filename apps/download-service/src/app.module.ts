import { DatabaseModule } from '@app/database';
import { Dataset, File } from '@app/database/entities';
import { MetricsModule } from '@app/metrics';
import { RedisModule } from '@app/redis';
import { Module } from '@nestjs/common';
import { DownloadController } from './app.controller';
import { DownloadService } from './app.service';

@Module({
  imports: [
    DatabaseModule.register(),
    DatabaseModule.forFeature([File, Dataset]),
    RedisModule,
    MetricsModule,
  ],
  controllers: [DownloadController],
  providers: [DownloadService],
})
export class AppModule {}
