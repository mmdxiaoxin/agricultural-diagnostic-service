import { DatabaseModule } from '@app/database';
import { Dataset, File } from '@app/database/entities';
import { RedisModule } from '@app/redis';
import { Module } from '@nestjs/common';
import { UploadController } from './app.controller';
import { UploadService } from './app.service';
import { MetricsModule } from '@app/metrics';

@Module({
  imports: [
    DatabaseModule.register(),
    DatabaseModule.forFeature([File, Dataset]),
    RedisModule,
    MetricsModule,
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class AppModule {}
