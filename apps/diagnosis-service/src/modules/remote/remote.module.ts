import { DatabaseModule } from '@app/database';
import { RemoteService, RemoteInterface } from '@app/database/entities';
import { Module } from '@nestjs/common';
import { RemoteServiceController } from './remote.controller';
import { RemoteInterfaceService } from './services/remote-interface.service';
import { RemoteServiceService } from './services/remote.service';

@Module({
  imports: [DatabaseModule.forFeature([RemoteService, RemoteInterface])],
  providers: [RemoteServiceService, RemoteInterfaceService],
  controllers: [RemoteServiceController],
})
export class RemoteServiceModule {}
