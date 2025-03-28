import { CreateRemoteServiceDto } from '@common/dto/ai-service/create-remote-service.dto';
import { UpdateRemoteServiceDto } from '@common/dto/ai-service/update-remote-service.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { formatResponse } from '@shared/helpers/response.helper';
import { RemoteServiceService } from './services/remote.service';

@Controller()
export class RemoteServiceController {
  constructor(private readonly service: RemoteServiceService) {}

  @MessagePattern({ cmd: 'service.create' })
  async create(@Payload() payload: CreateRemoteServiceDto) {
    await this.service.create(payload);
    return formatResponse(201, null, '创建成功');
  }

  @MessagePattern({ cmd: 'service.get' })
  async findAll(@Payload() payload: void) {
    const services = await this.service.getRemote();
    return formatResponse(200, services, '获取成功');
  }

  @MessagePattern({ cmd: 'service.get.list' })
  async findPaginated(@Payload() payload: { page: number; pageSize: number }) {
    const [list, total] = await this.service.getRemoteList(
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
    const service = await this.service.getRemoteById(payload);
    return formatResponse(200, service, '获取成功');
  }

  @MessagePattern({ cmd: 'service.update' })
  async update(
    @Payload() payload: { serviceId: number; dto: UpdateRemoteServiceDto },
  ) {
    await this.service.update(payload.serviceId, payload.dto);
    return formatResponse(200, null, '更新成功');
  }

  @MessagePattern({ cmd: 'service.remove' })
  async remove(@Payload() payload: number) {
    await this.service.remove(payload);
    return formatResponse(204, null, '删除成功');
  }

  @MessagePattern({ cmd: 'service.copy' })
  async copy(@Payload() payload: number) {
    await this.service.copy(payload);
    return formatResponse(201, null, '复制成功');
  }
}
