import { CreateRemoteInterfaceDto } from '@common/dto/remote/create-remote-interface.dto';
import { CreateRemoteServiceDto } from '@common/dto/remote/create-remote-service.dto';
import { UpdateRemoteInterfaceDto } from '@common/dto/remote/update-remote-interface.dto';
import { UpdateRemoteServiceDto } from '@common/dto/remote/update-remote-service.dto';
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

  // 获取服务的所有配置
  getRemoteConfigs(serviceId: number) {
    return this.diagnosisClient.send({ cmd: 'service.config.get' }, serviceId);
  }

  // 分页获取服务的配置
  getRemoteConfigList(serviceId: number, page: number, pageSize: number) {
    return this.diagnosisClient.send(
      { cmd: 'service.config.get.list' },
      { serviceId, page, pageSize },
    );
  }

  // 获取单个配置
  getRemoteConfigById(configId: number) {
    return this.diagnosisClient.send(
      { cmd: 'service.config.get.byId' },
      configId,
    );
  }

  // 创建配置
  createRemoteConfig(serviceId: number, config: any) {
    return this.diagnosisClient.send(
      { cmd: 'service.config.create' },
      { serviceId, config },
    );
  }

  // 更新配置
  updateRemoteConfig(configId: number, config: any) {
    return this.diagnosisClient.send(
      { cmd: 'service.config.update' },
      { configId, config },
    );
  }

  // 删除配置
  removeRemoteConfig(configId: number) {
    return this.diagnosisClient.send(
      { cmd: 'service.config.remove' },
      configId,
    );
  }

  copyRemoteConfig(configId: number) {
    return this.diagnosisClient.send({ cmd: 'service.config.copy' }, configId);
  }

  copyRemoteInterface(interfaceId: number) {
    return this.diagnosisClient.send(
      { cmd: 'service.interface.copy' },
      interfaceId,
    );
  }
}
