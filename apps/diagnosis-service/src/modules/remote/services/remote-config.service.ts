import {
  RemoteConfig,
  RemoteService,
  RemoteInterface,
} from '@app/database/entities';
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
    @InjectRepository(RemoteInterface)
    private remoteInterfaceRepository: Repository<RemoteInterface>,
    private dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  // 验证配置的有效性
  private async validateConfig(
    config: Partial<RemoteConfig>,
    serviceId: number,
  ) {
    if (!config.config?.requests || !Array.isArray(config.config.requests)) {
      throw new RpcException({
        code: 400,
        message: '配置中必须包含有效的请求配置',
      });
    }

    const requests = config.config.requests;

    // 获取服务下的所有接口
    const interfaces = await this.remoteInterfaceRepository.find({
      where: { serviceId },
    });
    const interfaceMap = new Map(interfaces.map((i) => [i.id, i]));

    // 创建请求ID集合，用于验证result
    const requestIds = new Set(requests.map((req) => req.id));

    // 验证result属性
    if (config.config.result !== undefined) {
      if (!requestIds.has(config.config.result)) {
        throw new RpcException({
          code: 400,
          message: `result属性引用的接口ID ${config.config.result} 不存在于requests数组中`,
        });
      }
    }

    // 验证每个请求的接口ID是否存在
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      if (!request.id || !interfaceMap.has(request.id)) {
        throw new RpcException({
          code: 400,
          message: `请求配置中引用了不存在的接口ID: ${request.id}`,
        });
      }

      // 验证next数组中的接口ID
      if (request.next && Array.isArray(request.next)) {
        for (const nextId of request.next) {
          if (!interfaceMap.has(nextId)) {
            throw new RpcException({
              code: 400,
              message: `请求配置的next数组中引用了不存在的接口ID: ${nextId}`,
            });
          }

          // 检查引用的接口是否存在于requests数组中
          const nextRequest = requests.find((req) => req.id === nextId);
          if (!nextRequest) {
            throw new RpcException({
              code: 400,
              message: `请求配置的next数组中引用的接口ID ${nextId} 不存在于requests数组中`,
            });
          }
        }
      }

      // 验证params中的模板变量
      if (request.params) {
        const templateRegex = /{{#(\d+)\.([^}]+)}}/g;

        // 递归检查对象中的所有值
        const checkValue = (value: any) => {
          if (typeof value === 'string' && value.includes('{{#')) {
            const matches = value.matchAll(templateRegex);
            for (const match of matches) {
              const referencedId = parseInt(match[1], 10);
              if (!interfaceMap.has(referencedId)) {
                throw new RpcException({
                  code: 400,
                  message: `参数中引用了不存在的接口ID: ${referencedId}`,
                });
              }

              // 检查引用的接口是否在当前请求之前
              const referencedIndex = requests.findIndex(
                (req) => req.id === referencedId,
              );
              if (referencedIndex === -1) {
                throw new RpcException({
                  code: 400,
                  message: `参数中引用的接口ID ${referencedId} 不存在于requests数组中`,
                });
              }
              if (referencedIndex >= i) {
                throw new RpcException({
                  code: 400,
                  message: `参数中引用的接口ID ${referencedId} 必须在当前请求之前`,
                });
              }
            }
          } else if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
              value.forEach((item) => checkValue(item));
            } else {
              Object.values(value).forEach((val) => checkValue(val));
            }
          }
        };

        checkValue(request.params);
      }
    }
  }

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

      // 验证配置的有效性
      await this.validateConfig(config, serviceId);

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
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        code: 500,
        message: '创建配置失败',
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

      // 验证配置的有效性
      await this.validateConfig(config, existingConfig.service.id);

      Object.assign(existingConfig, config);
      const updatedConfig = await queryRunner.manager.save(existingConfig);
      await queryRunner.commitTransaction();

      // 清除相关缓存
      await this.clearRelatedCache(existingConfig.service.id);

      return updatedConfig;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        code: 500,
        message: '更新配置失败',
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
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        code: 500,
        message: '删除配置失败',
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
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        code: 500,
        message: '复制配置失败',
      });
    } finally {
      await queryRunner.release();
    }
  }
}
