import { RemoteConfig, RemoteService } from '@app/database/entities';
import { RedisService } from '@app/redis';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class RemoteConfigService {
  private readonly CACHE_KEYS = {
    REMOTE_SERVICE: 'remote:service',
    REMOTE_SERVICE_LIST: 'remote:service:list',
  } as const;

  constructor(
    @InjectRepository(RemoteConfig)
    private remoteConfigRepository: Repository<RemoteConfig>,
    private dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  // 清除相关缓存
  private async clearRelatedCache(serviceId: number) {
    const patterns = [
      `${this.CACHE_KEYS.REMOTE_SERVICE_LIST}:*`,
      `${this.CACHE_KEYS.REMOTE_SERVICE}:${serviceId}`,
    ];

    for (const pattern of patterns) {
      const keys = await this.redisService.getClient().keys(pattern);
      if (keys.length > 0) {
        await this.redisService.getClient().del(...keys);
      }
    }
  }

  // 获取服务的所有配置
  async findByServiceId(serviceId: number): Promise<RemoteConfig[]> {
    return this.remoteConfigRepository.find({
      where: { serviceId },
      relations: ['service'],
    });
  }

  // 分页获取服务的配置
  async findList(serviceId: number, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    return await this.remoteConfigRepository.findAndCount({
      where: { serviceId },
      skip,
      take: pageSize,
      relations: ['service'],
    });
  }

  // 获取单个配置
  async findById(configId: number): Promise<RemoteConfig> {
    const config = await this.remoteConfigRepository.findOne({
      where: { id: configId },
      relations: ['service'],
    });

    if (!config) {
      throw new RpcException({
        code: 404,
        message: '未找到当前配置',
      });
    }

    return config;
  }

  // 创建配置
  async create(
    serviceId: number,
    config: Partial<RemoteConfig>,
  ): Promise<RemoteConfig> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 检查服务是否存在
      const service = await queryRunner.manager.findOne(RemoteService, {
        where: { id: serviceId },
      });

      if (!service) {
        throw new RpcException({
          code: 404,
          message: '未找到当前服务',
        });
      }

      // 创建配置
      const newConfig = queryRunner.manager.create(RemoteConfig, {
        ...config,
        service,
        serviceId,
      });

      const savedConfig = await queryRunner.manager.save(newConfig);
      await queryRunner.commitTransaction();

      // 清除相关缓存
      await this.clearRelatedCache(serviceId);

      return savedConfig;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new RpcException({
        code: 500,
        message: '创建配置失败',
        data: error,
      });
    } finally {
      await queryRunner.release();
    }
  }

  // 更新配置
  async update(
    configId: number,
    config: Partial<RemoteConfig>,
  ): Promise<RemoteConfig> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingConfig = await queryRunner.manager.findOne(RemoteConfig, {
        where: { id: configId },
        relations: ['service'],
      });

      if (!existingConfig) {
        throw new RpcException({
          code: 404,
          message: '未找到当前配置',
        });
      }

      Object.assign(existingConfig, config);
      const updatedConfig = await queryRunner.manager.save(existingConfig);
      await queryRunner.commitTransaction();

      // 清除相关缓存
      await this.clearRelatedCache(existingConfig.service.id);

      return updatedConfig;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new RpcException({
        code: 500,
        message: '更新配置失败',
        data: error,
      });
    } finally {
      await queryRunner.release();
    }
  }

  // 删除配置
  async remove(configId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const config = await queryRunner.manager.findOne(RemoteConfig, {
        where: { id: configId },
        relations: ['service'],
      });

      if (!config) {
        throw new RpcException({
          code: 404,
          message: '未找到当前配置',
        });
      }

      const serviceId = config.service.id;
      await queryRunner.manager.remove(config);
      await queryRunner.commitTransaction();

      // 清除相关缓存
      await this.clearRelatedCache(serviceId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new RpcException({
        code: 500,
        message: '删除配置失败',
        data: error,
      });
    } finally {
      await queryRunner.release();
    }
  }

  // 复制配置
  async copy(configId: number): Promise<RemoteConfig> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const config = await queryRunner.manager.findOne(RemoteConfig, {
        where: { id: configId },
        relations: ['service'],
      });

      if (!config) {
        throw new RpcException({
          code: 404,
          message: '未找到当前配置',
        });
      }

      // 创建新的配置对象，移除 id 和创建时间等字段
      const { id, createdAt, updatedAt, ...configData } = config;
      const newConfig = queryRunner.manager.create(RemoteConfig, {
        ...configData,
        name: `${configData.name}_copy`,
      });

      const savedConfig = await queryRunner.manager.save(newConfig);
      await queryRunner.commitTransaction();

      // 清除相关缓存
      await this.clearRelatedCache(config.service.id);

      return savedConfig;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new RpcException({
        code: 500,
        message: '复制配置失败',
        data: error,
      });
    } finally {
      await queryRunner.release();
    }
  }
}
