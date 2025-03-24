import { AiService, AiServiceConfig } from '@app/database/entities';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateAiConfigDto } from '../../../../../../packages/common/src/dto/ai-service/create-ai-config.dto';
import { CreateAiConfigsDto } from '../../../../../../packages/common/src/dto/ai-service/create-ai-configs.dto';
import { UpdateAiConfigDto } from '../../../../../../packages/common/src/dto/ai-service/update-ai-config.dto';
import { UpdateAiConfigsDto } from '@common/dto/ai-service/update-ai-configs.dto';

@Injectable()
export class AiConfigsService {
  constructor(
    @InjectRepository(AiService)
    private aiServiceRepository: Repository<AiService>,
    @InjectRepository(AiServiceConfig)
    private aiServiceConfigRepository: Repository<AiServiceConfig>,
    private readonly dataSource: DataSource,
  ) {}

  // 获取服务配置
  async findServiceConfigs(serviceId: number) {
    const service = await this.aiServiceRepository.findOne({
      where: { serviceId },
      relations: ['aiServiceConfigs'],
    });
    if (!service) {
      throw new RpcException('AI服务不存在');
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
      throw new RpcException('AI服务不存在');
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
      throw new RpcException('AI服务不存在');
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
      throw new RpcException('AI服务配置不存在');
    }
    if (configKey) {
      config.configKey = configKey;
    }
    if (configValue) {
      config.configValue = configValue;
    }
    await this.aiServiceConfigRepository.save(config);
  }

  // 更新 AI 服务配置
  async updateConfigs(serviceId: number, dto: UpdateAiConfigsDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const service = await queryRunner.manager.findOne(
        this.aiServiceRepository.target,
        {
          where: { serviceId },
          relations: ['aiServiceConfigs'],
        },
      );

      if (!service) {
        throw new RpcException({
          code: 404,
          message: 'AI服务不存在',
        });
      }

      // 删除旧配置
      await queryRunner.manager.remove(service.aiServiceConfigs);

      // 保存新配置
      const newConfigs = dto.configs.map((config) =>
        this.aiServiceConfigRepository.create({ ...config, service }),
      );
      await queryRunner.manager.save(newConfigs);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 删除AI服务配置
  async removeConfig(configId: number) {
    const config = await this.aiServiceConfigRepository.findOne({
      where: { configId },
    });
    if (!config) {
      throw new RpcException('AI服务配置不存在');
    }
    await this.aiServiceConfigRepository.remove(config);
  }
}
