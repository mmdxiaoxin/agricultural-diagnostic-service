import { CreateAiConfigDto } from '@common/dto/ai-service/create-ai-config.dto';
import { CreateAiConfigsDto } from '@common/dto/ai-service/create-ai-configs.dto';
import { CreateAiServiceDto } from '@common/dto/ai-service/create-ai-service.dto';
import { UpdateAiServiceDto } from '@common/dto/ai-service/update-ai-service.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { formatResponse } from '@shared/helpers/response.helper';
import { AiConfigsService } from './services/ai-service-config.service';
import { AiServiceService } from './services/ai-service.service';

@Controller()
export class AiServiceController {
  constructor(
    private readonly aiService: AiServiceService,
    private readonly aiConfigs: AiConfigsService,
  ) {}

  @MessagePattern({ cmd: 'ai-service.create' })
  async create(@Payload() payload: CreateAiServiceDto) {
    await this.aiService.create(payload);
    return formatResponse(201, null, '创建成功');
  }

  @MessagePattern({ cmd: 'ai-service.get' })
  async findAll(@Payload() payload: void) {
    const services = await this.aiService.getAi();
    return formatResponse(200, services, '获取成功');
  }

  @MessagePattern({ cmd: 'ai-service.get.list' })
  async findPaginated(@Payload() payload: { page: number; pageSize: number }) {
    const [list, total] = await this.aiService.getAiList(
      payload.page,
      payload.pageSize,
    );
    return formatResponse(
      200,
      { list, total, page: payload.page, pageSize: payload.pageSize },
      '获取成功',
    );
  }

  @MessagePattern({ cmd: 'ai-service.get.byId' })
  async findOne(@Payload() payload: number) {
    const service = await this.aiService.getAIById(payload);
    return formatResponse(200, service, '获取成功');
  }

  @MessagePattern({ cmd: 'ai-service.update' })
  async update(
    @Payload() payload: { serviceId: number; dto: UpdateAiServiceDto },
  ) {
    await this.aiService.update(payload.serviceId, payload.dto);
    return formatResponse(200, null, '更新成功');
  }

  @MessagePattern({ cmd: 'ai-service.remove' })
  async remove(@Payload() payload: number) {
    await this.aiService.remove(payload);
    return formatResponse(204, null, '删除成功');
  }

  @MessagePattern({ cmd: 'ai-service.config.create' })
  async addConfig(
    @Payload() payload: { serviceId: number; dto: CreateAiConfigDto },
  ) {
    await this.aiConfigs.addConfig(payload.serviceId, payload.dto);
    return formatResponse(201, null, '创建成功');
  }

  @MessagePattern({ cmd: 'ai-service.configs.create' })
  async addConfigs(
    @Payload() payload: { serviceId: number; dto: CreateAiConfigsDto },
  ) {
    await this.aiConfigs.addConfigs(payload.serviceId, payload.dto);
    return formatResponse(201, null, '创建成功');
  }

  @MessagePattern({ cmd: 'ai-service.configs.get' })
  async findServiceConfigs(@Payload() payload: number) {
    const configs = await this.aiConfigs.findServiceConfigs(payload);
    return formatResponse(200, configs, '获取成功');
  }

  @MessagePattern({ cmd: 'ai-service.config.update' })
  async updateConfig(
    @Payload() payload: { configId: number; dto: CreateAiConfigDto },
  ) {
    await this.aiConfigs.updateConfig(payload.configId, payload.dto);
    return formatResponse(200, null, '更新成功');
  }

  @MessagePattern({ cmd: 'ai-service.config.remove' })
  async removeConfig(@Payload() payload: number) {
    await this.aiConfigs.removeConfig(payload);
    return formatResponse(204, null, '删除成功');
  }
}
