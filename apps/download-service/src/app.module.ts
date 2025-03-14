import { DatabaseModule } from '@app/database';
import { Dataset, File } from '@app/database/entities';
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { DownloadController } from './app.controller';
import { DownloadService } from './app.service';

@Module({
  imports: [
    DatabaseModule.register(),
    DatabaseModule.forFeature([File, Dataset]),
    PrometheusModule.register(),
  ],
  controllers: [DownloadController],
  providers: [DownloadService],
})
export class AppModule {}
