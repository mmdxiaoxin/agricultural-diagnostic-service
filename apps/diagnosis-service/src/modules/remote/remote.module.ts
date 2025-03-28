import { DatabaseModule } from '@app/database';
import {
  RemoteInterface,
  RemoteService,
  RemoteConfig,
} from '@app/database/entities';
import { Module } from '@nestjs/common';
import { RemoteServiceController } from './remote.controller';
import { RemoteInterfaceService } from './services/remote-interface.service';
import { RemoteServiceService } from './services/remote.service';
import { RemoteConfigService } from './services/remote-config.service';

@Module({
  imports: [
    DatabaseModule.forFeature([RemoteService, RemoteInterface, RemoteConfig]),
  ],
  providers: [
    RemoteServiceService,
    RemoteInterfaceService,
    RemoteConfigService,
  ],
  controllers: [RemoteServiceController],
})
export class RemoteServiceModule {}
