import { DatabaseModule } from '@app/database';
import { Dataset, File } from '@app/database/entities';
import { RedisModule } from '@app/redis';
import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { UploadController } from './app.controller';
import { UploadService } from './app.service';

@Module({
  imports: [
    DatabaseModule.register(),
    DatabaseModule.forFeature([File, Dataset]),
    RedisModule,
    PrometheusModule.register(),
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class AppModule {}
