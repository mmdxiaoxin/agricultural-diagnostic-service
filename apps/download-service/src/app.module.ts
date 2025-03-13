import { DatabaseModule } from '@app/database';
import { Dataset, File } from '@app/database/entities';
import { RedisModule } from '@app/redis';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import {
  FILE_SERVICE_NAME,
  FILE_SERVICE_HTTP_PORT,
} from 'config/microservice.config';
import { DownloadController } from './app.controller';

@Module({
  imports: [
    DatabaseModule.register(),
    DatabaseModule.forFeature([File, Dataset]),
    RedisModule,
    ClientsModule.register([
      {
        name: FILE_SERVICE_NAME,
        transport: Transport.TCP,
        options: {
          port: FILE_SERVICE_HTTP_PORT,
        },
      },
    ]),
    PrometheusModule.register(),
  ],
  controllers: [DownloadController],
})
export class AppModule {}
