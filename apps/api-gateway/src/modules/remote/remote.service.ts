import { CreateRemoteConfigDto } from '@common/dto/remote/create-remote-config.dto';
import { CreateRemoteConfigsDto } from '@common/dto/remote/create-remote-configs.dto';
import { CreateRemoteServiceDto } from '@common/dto/remote/create-remote-service.dto';
import { UpdateAiConfigsDto } from '@common/dto/remote/update-remote-configs.dto';
import { UpdateRemoteServiceDto } from '@common/dto/remote/update-remote-service.dto';
import { CreateRemoteInterfaceDto } from '@common/dto/remote/create-remote-interface.dto';
import { UpdateRemoteInterfaceDto } from '@common/dto/remote/update-remote-interface.dto';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { DIAGNOSIS_SERVICE_NAME } from 'config/microservice.config';

@Injectable()
export class RemoteService {
  constructor(
    @Inject(DIAGNOSIS_SERVICE_NAME)
    private readonly diagnosisClient: ClientProxy,
  ) {}

  createRemote(dto: CreateRemoteServiceDto) {
    return this.diagnosisClient.send({ cmd: 'service.create' }, dto);
  }

  getRemote() {
    return this.diagnosisClient.send({ cmd: 'service.get' }, {});
  }

  getRemoteList(page: number, pageSize: number) {
    return this.diagnosisClient.send(
      { cmd: 'service.get.list' },
      { page, pageSize },
    );
  }

  getRemoteById(id: number) {
    return this.diagnosisClient.send({ cmd: 'service.get.byId' }, id);
  }

  updateRemote(serviceId: number, dto: UpdateRemoteServiceDto) {
    return this.diagnosisClient.send(
      { cmd: 'service.update' },
      { serviceId, dto },
    );
  }

  removeRemote(id: number) {
    return this.diagnosisClient.send({ cmd: 'service.remove' }, id);
  }

  copyRemote(id: number) {
    return this.diagnosisClient.send({ cmd: 'service.copy' }, id);
  }

  createRemoteInterface(serviceId: number, dto: CreateRemoteInterfaceDto) {
    return this.diagnosisClient.send(
      { cmd: 'service.interface.create' },
      { serviceId, dto },
    );
  }

  getRemoteInterfaces(serviceId: number) {
    return this.diagnosisClient.send(
      { cmd: 'service.interface.get' },
      serviceId,
    );
  }

  getRemoteInterfaceList(serviceId: number, page: number, pageSize: number) {
    return this.diagnosisClient.send(
      { cmd: 'service.interface.get.list' },
      { serviceId, page, pageSize },
    );
  }

  getRemoteInterfaceById(interfaceId: number) {
    return this.diagnosisClient.send(
      { cmd: 'service.interface.get.byId' },
      interfaceId,
    );
  }

  updateRemoteInterface(interfaceId: number, dto: UpdateRemoteInterfaceDto) {
    return this.diagnosisClient.send(
      { cmd: 'service.interface.update' },
      { interfaceId, dto },
    );
  }

  removeRemoteInterface(interfaceId: number) {
    return this.diagnosisClient.send(
      { cmd: 'service.interface.remove' },
      interfaceId,
    );
  }
}
