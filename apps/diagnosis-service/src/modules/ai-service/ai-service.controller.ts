import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { formatResponse } from '@shared/helpers/response.helper';
import { CreateAiConfigDto } from '../../../../../packages/common/src/dto/ai-service/create-ai-config.dto';
import { CreateAiConfigsDto } from '../../../../../packages/common/src/dto/ai-service/create-ai-configs.dto';
import { CreateAiServiceDto } from '../../../../../packages/common/src/dto/ai-service/create-ai-service.dto';
import { UpdateAiServiceDto } from '../../../../../packages/common/src/dto/ai-service/update-ai-service.dto';
import { AiConfigsService } from './services/ai-service-config.service';
import { AiServiceService } from './services/ai-service.service';

@Controller()
export class AiServiceController {
  constructor(
    private readonly aiServiceService: AiServiceService,
    private readonly aiConfigsService: AiConfigsService,
  ) {}

  @MessagePattern({ cmd: 'ai-service.create' })
  async create(@Payload() payload: CreateAiServiceDto) {
    await this.aiServiceService.create(payload);
    return formatResponse(201, null, '创建成功');
  }

  @MessagePattern({ cmd: 'ai-service.findAll' })
  async findAll(@Payload() payload: void) {
    const services = await this.aiServiceService.findAll();
    return formatResponse(200, services, '获取成功');
  }

  @MessagePattern({ cmd: 'ai-service.findPaginated' })
  async findPaginated(@Payload() payload: { page: number; pageSize: number }) {
    const [list, total] = await this.aiServiceService.findPaginated(
      payload.page,
      payload.pageSize,
    );
    return formatResponse(
      200,
      { list, total, page: payload.page, pageSize: payload.pageSize },
      '获取成功',
    );
  }

  @MessagePattern({ cmd: 'ai-service.findOne' })
  async findOne(@Payload() payload: number) {
    const service = await this.aiServiceService.findOne(payload);
    return formatResponse(200, service, '获取成功');
  }

  @MessagePattern({ cmd: 'ai-service.update' })
  async update(
    @Payload() payload: { serviceId: number; dto: UpdateAiServiceDto },
  ) {
    await this.aiServiceService.update(payload.serviceId, payload.dto);
    return formatResponse(200, null, '更新成功');
  }

  @MessagePattern({ cmd: 'ai-service.remove' })
  async remove(@Payload() payload: number) {
    await this.aiServiceService.remove(payload);
    return formatResponse(204, null, '删除成功');
  }

  @MessagePattern({ cmd: 'ai-service.addConfig' })
  async addConfig(
    @Payload() payload: { serviceId: number; dto: CreateAiConfigDto },
  ) {
    await this.aiConfigsService.addConfig(payload.serviceId, payload.dto);
    return formatResponse(201, null, '创建成功');
  }

  @MessagePattern({ cmd: 'ai-service.addConfigs' })
  async addConfigs(
    @Payload() payload: { serviceId: number; dto: CreateAiConfigsDto },
  ) {
    await this.aiConfigsService.addConfigs(payload.serviceId, payload.dto);
    return formatResponse(201, null, '创建成功');
  }

  @MessagePattern({ cmd: 'ai-service.findServiceConfigs' })
  async findServiceConfigs(@Payload() payload: number) {
    const configs = await this.aiConfigsService.findServiceConfigs(payload);
    return formatResponse(200, configs, '获取成功');
  }

  @MessagePattern({ cmd: 'ai-service.updateConfig' })
  async updateConfig(
    @Payload() payload: { configId: number; dto: CreateAiConfigDto },
  ) {
    await this.aiConfigsService.updateConfig(payload.configId, payload.dto);
    return formatResponse(200, null, '更新成功');
  }

  @MessagePattern({ cmd: 'ai-service.removeConfig' })
  async removeConfig(@Payload() payload: number) {
    await this.aiConfigsService.removeConfig(payload);
    return formatResponse(204, null, '删除成功');
  }
}
