import { RemoteService, RemoteInterface } from '@app/database/entities';
import { CreateAiConfigDto } from '@common/dto/ai-service/create-remote-config.dto';
import { CreateAiConfigsDto } from '@common/dto/ai-service/create-remote-configs.dto';
import { UpdateAiConfigDto } from '@common/dto/ai-service/update-remote-config.dto';
import { UpdateAiConfigsDto } from '@common/dto/ai-service/update-remote-configs.dto';
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class RemoteInterfaceService {
  private readonly logger = new Logger(RemoteInterfaceService.name);

  constructor(
    @InjectRepository(RemoteService)
    private serviceRepository: Repository<RemoteService>,
    @InjectRepository(RemoteInterface)
    private serviceInterfaceRepository: Repository<RemoteInterface>,
    private readonly dataSource: DataSource,
  ) {}
}
