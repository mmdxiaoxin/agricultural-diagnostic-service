import { CreateRemoteInterfaceDto } from '@common/dto/remote/create-remote-interface.dto';
import { CreateRemoteServiceDto } from '@common/dto/remote/create-remote-service.dto';
import { UpdateRemoteInterfaceDto } from '@common/dto/remote/update-remote-interface.dto';
import { UpdateRemoteServiceDto } from '@common/dto/remote/update-remote-service.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { formatResponse } from '@shared/helpers/response.helper';
import { RemoteInterfaceService } from './services/remote-interface.service';
import { RemoteServiceService } from './services/remote.service';
import { RemoteConfigService } from './services/remote-config.service';

@Controller()
export class RemoteServiceController {
  constructor(
    private readonly remoteService: RemoteServiceService,
    private readonly interfaceService: RemoteInterfaceService,
    private readonly configService: RemoteConfigService,
  ) {}

  @MessagePattern({ cmd: 'service.create' })
  async create(@Payload() payload: CreateRemoteServiceDto) {
    await this.remoteService.create(payload);
    return formatResponse(201, null, '创建成功');
  }

  @MessagePattern({ cmd: 'service.get' })
  async findAll(@Payload() payload: void) {
    const services = await this.remoteService.find();
    return formatResponse(200, services, '获取成功');
  }

  @MessagePattern({ cmd: 'service.get.list' })
  async findPaginated(@Payload() payload: { page: number; pageSize: number }) {
    const [list, total] = await this.remoteService.findList(
      payload.page,
      payload.pageSize,
    );
    return formatResponse(
      200,
      { list, total, page: payload.page, pageSize: payload.pageSize },
      '获取成功',
    );
  }

  @MessagePattern({ cmd: 'service.get.byId' })
  async findOne(@Payload() payload: number) {
    const service = await this.remoteService.findById(payload);
    return formatResponse(200, service, '获取成功');
  }

  @MessagePattern({ cmd: 'service.update' })
  async update(
    @Payload() payload: { serviceId: number; dto: UpdateRemoteServiceDto },
  ) {
    await this.remoteService.update(payload.serviceId, payload.dto);
    return formatResponse(200, null, '更新成功');
  }

  @MessagePattern({ cmd: 'service.remove' })
  async remove(@Payload() payload: number) {
    await this.remoteService.remove(payload);
    return formatResponse(204, null, '删除成功');
  }

  @MessagePattern({ cmd: 'service.copy' })
  async copy(@Payload() payload: number) {
    await this.remoteService.copy(payload);
    return formatResponse(201, null, '复制成功');
  }

  @MessagePattern({ cmd: 'service.interface.create' })
  async createInterface(
    @Payload() payload: { serviceId: number; dto: CreateRemoteInterfaceDto },
  ) {
    await this.interfaceService.createInterface(payload.serviceId, payload.dto);
    return formatResponse(201, null, '创建成功');
  }

  @MessagePattern({ cmd: 'service.interface.update' })
  async updateInterface(
    @Payload() payload: { interfaceId: number; dto: UpdateRemoteInterfaceDto },
  ) {
    await this.interfaceService.updateInterface(
      payload.interfaceId,
      payload.dto,
    );
    return formatResponse(200, null, '更新成功');
  }

  @MessagePattern({ cmd: 'service.interface.remove' })
  async removeInterface(@Payload() payload: number) {
    await this.interfaceService.removeInterface(payload);
    return formatResponse(204, null, '删除成功');
  }

  @MessagePattern({ cmd: 'service.interface.get' })
  async getInterface(@Payload() payload: number) {
    const interface_ = await this.interfaceService.getInterfaces(payload);
    return formatResponse(200, interface_, '获取成功');
  }

  @MessagePattern({ cmd: 'service.interface.get.list' })
  async getInterfaceList(
    @Payload() payload: { serviceId: number; page: number; pageSize: number },
  ) {
    const { list, total, page, pageSize } =
      await this.interfaceService.getInterfacesList(
        payload.serviceId,
        payload.page,
        payload.pageSize,
      );
    return formatResponse(200, { list, total, page, pageSize }, '获取成功');
  }

  @MessagePattern({ cmd: 'service.interface.get.byId' })
  async getInterfaceById(@Payload() payload: number) {
    const interface_ = await this.interfaceService.getInterfaceById(payload);
    return formatResponse(200, interface_, '获取成功');
  }

  @MessagePattern({ cmd: 'service.config.get' })
  async getConfigs(@Payload() serviceId: number) {
    const configs = await this.configService.findByServiceId(serviceId);
    return formatResponse(200, configs, '获取成功');
  }

  @MessagePattern({ cmd: 'service.config.get.list' })
  async getConfigsList(
    @Payload() payload: { serviceId: number; page: number; pageSize: number },
  ) {
    const [list, total] = await this.configService.findList(
      payload.serviceId,
      payload.page,
      payload.pageSize,
    );
    return formatResponse(
      200,
      { list, total, page: payload.page, pageSize: payload.pageSize },
      '获取成功',
    );
  }

  @MessagePattern({ cmd: 'service.config.get.byId' })
  async getConfigById(@Payload() configId: number) {
    const config = await this.configService.findById(configId);
    return formatResponse(200, config, '获取成功');
  }

  @MessagePattern({ cmd: 'service.config.create' })
  async createConfig(@Payload() payload: { serviceId: number; config: any }) {
    await this.configService.create(payload.serviceId, payload.config);
    return formatResponse(201, null, '创建成功');
  }

  @MessagePattern({ cmd: 'service.config.update' })
  async updateConfig(@Payload() payload: { configId: number; config: any }) {
    await this.configService.update(payload.configId, payload.config);
    return formatResponse(200, null, '更新成功');
  }

  @MessagePattern({ cmd: 'service.config.remove' })
  async removeConfig(@Payload() configId: number) {
    await this.configService.remove(configId);
    return formatResponse(204, null, '删除成功');
  }
}
