import { AiService, AiServiceConfig } from '@app/database/entities';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAiConfigDto } from '../dto/create-ai-config.dto';
import { CreateAiConfigsDto } from '../dto/create-ai-configs.dto';
import { UpdateAiConfigDto } from '../dto/update-ai-config.dto';

@Injectable()
export class AiConfigsService {
  constructor(
    @InjectRepository(AiService)
    private aiServiceRepository: Repository<AiService>,

    @InjectRepository(AiServiceConfig)
    private aiServiceConfigRepository: Repository<AiServiceConfig>,
  ) {}

  // 获取服务配置
  async findServiceConfigs(serviceId: number) {
    const service = await this.aiServiceRepository.findOne({
      where: { serviceId },
      relations: ['aiServiceConfigs'],
    });
    if (!service) {
      throw new NotFoundException('AI服务不存在');
    }
    return service.aiServiceConfigs;
  }

  // 增加AI服务配置
  async addConfig(serviceId: number, dto: CreateAiConfigDto) {
    const service = await this.aiServiceRepository.findOne({
      where: { serviceId },
      relations: ['aiServiceConfigs'],
    });
    if (!service) {
      throw new NotFoundException('AI服务不存在');
    }
    const newConfig = this.aiServiceConfigRepository.create({
      ...dto,
      service,
    });
    await this.aiServiceConfigRepository.save(newConfig);
  }

  // 批量增加AI服务配置
  async addConfigs(serviceId: number, dto: CreateAiConfigsDto) {
    const service = await this.aiServiceRepository.findOne({
      where: { serviceId },
      relations: ['aiServiceConfigs'],
    });
    if (!service) {
      throw new NotFoundException('AI服务不存在');
    }
    const newConfigs = dto.configs.map((config) =>
      this.aiServiceConfigRepository.create({
        ...config,
        service,
      }),
    );
    await this.aiServiceConfigRepository.save(newConfigs);
  }

  // 更新AI服务配置
  async updateConfig(configId: number, dto: UpdateAiConfigDto) {
    const { configKey, configValue } = dto;
    const config = await this.aiServiceConfigRepository.findOne({
      where: { configId },
    });
    if (!config) {
      throw new NotFoundException('AI服务配置不存在');
    }
    if (configKey) {
      config.configKey = configKey;
    }
    if (configValue) {
      config.configValue = configValue;
    }
    await this.aiServiceConfigRepository.save(config);
  }

  // 删除AI服务配置
  async removeConfig(configId: number) {
    const config = await this.aiServiceConfigRepository.findOne({
      where: { configId },
    });
    if (!config) {
      throw new NotFoundException('AI服务配置不存在');
    }
    await this.aiServiceConfigRepository.remove(config);
  }
}
