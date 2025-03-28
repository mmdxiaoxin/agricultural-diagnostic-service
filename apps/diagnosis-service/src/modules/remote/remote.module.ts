import { DatabaseModule } from '@app/database';
import { RemoteInterface, RemoteService } from '@app/database/entities';
import { RemoteConfig } from '@app/database/entities/remote-config.entity';
import { Module } from '@nestjs/common';
import { RemoteServiceController } from './remote.controller';
import { RemoteInterfaceService } from './services/remote-interface.service';
import { RemoteServiceService } from './services/remote.service';

@Module({
  imports: [
    DatabaseModule.forFeature([RemoteService, RemoteInterface, RemoteConfig]),
  ],
  providers: [RemoteServiceService, RemoteInterfaceService],
  controllers: [RemoteServiceController],
})
export class RemoteServiceModule {}
