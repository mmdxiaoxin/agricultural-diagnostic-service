import { DatabaseModule } from '@app/database';
import {
  RemoteConfig,
  RemoteInterface,
  RemoteService,
} from '@app/database/entities';
import { RedisModule } from '@app/redis';
import { HttpService } from '@common/services/http.service';
import { Module } from '@nestjs/common';
import { RemoteServiceController } from './remote.controller';
import { RemoteConfigService } from './services/remote-config.service';
import { RemoteInterfaceService } from './services/remote-interface.service';
import { RemoteServiceService } from './services/remote.service';

@Module({
  imports: [
    RedisModule,
    DatabaseModule.forFeature([RemoteService, RemoteInterface, RemoteConfig]),
  ],
  providers: [
    RemoteServiceService,
    RemoteInterfaceService,
    RemoteConfigService,
    HttpService,
  ],
  controllers: [RemoteServiceController],
})
export class RemoteServiceModule {}
