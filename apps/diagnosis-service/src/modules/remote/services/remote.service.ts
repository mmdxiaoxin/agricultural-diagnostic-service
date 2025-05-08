import {
  RemoteService,
  RemoteInterface,
  RemoteConfig,
} from '@app/database/entities';
import { RedisService } from '@app/redis';
import { CreateRemoteServiceDto } from '@common/dto/remote/create-remote-service.dto';
import { UpdateRemoteServiceDto } from '@common/dto/remote/update-remote-service.dto';
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class RemoteServiceService {
  private readonly logger = new Logger(RemoteServiceService.name);
  private readonly CACHE_TTL = 300; // 缓存时间5分钟，考虑到远程服务配置可能经常变动

  // 缓存键前缀
  private readonly CACHE_KEYS = {
    REMOTE_SERVICE: 'remote:service',
    REMOTE_SERVICE_LIST: 'remote:service:list',
  } as const;

  constructor(
    @InjectRepository(RemoteService)
    private remoteServiceRepository: Repository<RemoteService>,
    private dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  // 生成缓存键的辅助方法
  private generateCacheKey(
    type: keyof typeof this.CACHE_KEYS,
    ...args: any[]
  ): string {
    const prefix = this.CACHE_KEYS[type];
    switch (type) {
      case 'REMOTE_SERVICE':
        return `${prefix}:${args[0]}`; // remote:service:id
      case 'REMOTE_SERVICE_LIST':
        return `${prefix}:${args[0]}:${args[1]}`; // remote:service:list:page:pageSize
      default:
        return prefix;
    }
  }

  // 清除相关缓存
  private async clearRelatedCache(serviceId?: number) {
    const patterns = [`${this.CACHE_KEYS.REMOTE_SERVICE_LIST}:*`];

    if (serviceId) {
      patterns.push(`${this.CACHE_KEYS.REMOTE_SERVICE}:${serviceId}`);
    }

    for (const pattern of patterns) {
      const keys = await this.redisService.getClient().keys(pattern);
      if (keys.length > 0) {
        await this.redisService.getClient().del(...keys);
      }
    }
  }

  // 清除诊断服务中的远程服务缓存
  private async clearDiagnosisServiceCache(serviceId?: number) {
    const patterns = ['remote:service:*'];
    if (serviceId) {
      patterns.push(`remote:service:${serviceId}`);
    }

    for (const pattern of patterns) {
      const keys = await this.redisService.getClient().keys(pattern);
      if (keys.length > 0) {
        await this.redisService.getClient().del(...keys);
      }
    }
  }

  // 获取全部远程服务
  async find(): Promise<RemoteService[]> {
    const cacheKey = this.generateCacheKey('REMOTE_SERVICE_LIST', 'all');
    const cachedResult = await this.redisService.get<RemoteService[]>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    const services = await this.remoteServiceRepository.find({
      relations: ['interfaces', 'configs'],
    });

    // 缓存结果
    await this.redisService.set(cacheKey, services, this.CACHE_TTL);

    return services;
  }

  // 分页查询远程服务
  async findList(page: number, pageSize: number) {
    const cacheKey = this.generateCacheKey(
      'REMOTE_SERVICE_LIST',
      page,
      pageSize,
    );
    const cachedResult =
      await this.redisService.get<[RemoteService[], number]>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    const skip = (page - 1) * pageSize;
    const result = await this.remoteServiceRepository.findAndCount({
      skip,
      take: pageSize,
      relations: ['interfaces', 'configs'],
    });

    // 缓存结果
    await this.redisService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  // 获取单个远程服务
  async findById(serviceId: number) {
    const cacheKey = this.generateCacheKey('REMOTE_SERVICE', serviceId);
    const cachedResult = await this.redisService.get<RemoteService>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    const service = await this.remoteServiceRepository.findOne({
      where: { id: serviceId },
      relations: ['interfaces', 'configs'],
    });

    if (!service) {
      this.logger.error(`Remote service with ID ${serviceId} not found`);
      throw new RpcException({
        code: 404,
        message: '未找到当前服务',
      });
    }

    // 缓存结果
    await this.redisService.set(cacheKey, service, this.CACHE_TTL);

    return service;
  }

  // 创建远程服务
  async create(dto: CreateRemoteServiceDto): Promise<RemoteService> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 创建服务实例
      const remoteService = queryRunner.manager.create(RemoteService, {
        serviceName: dto.serviceName,
        serviceType: dto.serviceType,
        description: dto.description,
        status: dto.status || 'inactive',
      });

      // 保存服务
      const savedService = await queryRunner.manager.save(remoteService);

      // 处理配置
      if (dto.configs?.length) {
        const configs = dto.configs.map((config) =>
          queryRunner.manager.create(RemoteConfig, {
            ...config,
            service: savedService,
            serviceId: savedService.id,
          }),
        );
        await queryRunner.manager.save(configs);
      }

      await queryRunner.commitTransaction();

      // 清除相关缓存
      await this.clearRelatedCache();

      return savedService;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('创建远程服务失败:', error);
      throw new RpcException({
        code: 500,
        message: '创建服务失败',
        data: error,
      });
    } finally {
      await queryRunner.release();
    }
  }

  // 更新远程服务
  async update(
    serviceId: number,
    dto: UpdateRemoteServiceDto,
  ): Promise<RemoteService> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 查找服务
      const remoteService = await queryRunner.manager.findOne(RemoteService, {
        where: { id: serviceId },
        relations: ['configs'],
      });

      if (!remoteService) {
        this.logger.error(`Remote service with ID ${serviceId} not found`);
        throw new RpcException({
          code: 404,
          message: '未找到当前服务',
        });
      }

      // 更新服务基本信息
      Object.assign(remoteService, {
        serviceName: dto.serviceName || remoteService.serviceName,
        serviceType: dto.serviceType || remoteService.serviceType,
        description: dto.description || remoteService.description,
        status: dto.status || remoteService.status,
      });

      // 保存更新后的服务
      const updatedService = await queryRunner.manager.save(remoteService);

      // 处理配置更新
      if (dto.configs) {
        // 删除旧的配置
        if (remoteService.configs?.length) {
          await queryRunner.manager.remove(remoteService.configs);
        }

        // 创建新的配置
        if (dto.configs.length) {
          const configs = dto.configs.map((config) =>
            queryRunner.manager.create(RemoteConfig, {
              ...config,
              service: updatedService,
              serviceId: updatedService.id,
            }),
          );
          await queryRunner.manager.save(configs);
        }
      }

      await queryRunner.commitTransaction();

      // 清除相关缓存
      await this.clearRelatedCache(serviceId);
      await this.clearDiagnosisServiceCache(serviceId);

      return updatedService;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('更新远程服务失败:', error);
      throw new RpcException({
        code: 500,
        message: '更新服务失败',
        data: error,
      });
    } finally {
      await queryRunner.release();
    }
  }

  // 删除远程服务
  async remove(serviceId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 查找服务及其接口和配置
      const remoteService = await queryRunner.manager.findOne(RemoteService, {
        where: { id: serviceId },
        relations: ['interfaces', 'configs'],
      });

      if (!remoteService) {
        this.logger.error(`Remote service with ID ${serviceId} not found`);
        throw new RpcException({
          code: 404,
          message: '未找到当前服务',
        });
      }

      // 删除关联的接口
      if (remoteService.interfaces?.length) {
        await queryRunner.manager.remove(remoteService.interfaces);
      }

      // 删除关联的配置
      if (remoteService.configs?.length) {
        await queryRunner.manager.remove(remoteService.configs);
      }

      // 删除服务本身
      await queryRunner.manager.remove(remoteService);

      await queryRunner.commitTransaction();

      // 清除相关缓存
      await this.clearRelatedCache(serviceId);
      await this.clearDiagnosisServiceCache(serviceId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('删除远程服务失败:', error);
      throw new RpcException({
        code: 500,
        message: '删除服务失败',
        data: error,
      });
    } finally {
      await queryRunner.release();
    }
  }

  // 复制远程服务
  async copy(serviceId: number): Promise<RemoteService> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 查找原始服务及其接口和配置
      const originalService = await queryRunner.manager.findOne(RemoteService, {
        where: { id: serviceId },
        relations: ['interfaces', 'configs'],
      });

      if (!originalService) {
        this.logger.error(`Remote service with ID ${serviceId} not found`);
        throw new RpcException({
          code: 404,
          message: '未找到当前服务',
        });
      }

      // 创建新的服务实例
      const newService = queryRunner.manager.create(RemoteService, {
        serviceName: `${originalService.serviceName} - 复制`,
        serviceType: originalService.serviceType,
        description: originalService.description,
        status: originalService.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 保存新服务
      const savedService = await queryRunner.manager.save(newService);

      // 复制接口记录
      if (originalService.interfaces?.length) {
        const newInterfaces = originalService.interfaces.map((interface_) =>
          queryRunner.manager.create(RemoteInterface, {
            ...interface_,
            id: undefined,
            service: savedService,
            serviceId: savedService.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        );
        await queryRunner.manager.save(newInterfaces);
      }

      // 复制配置记录
      if (originalService.configs?.length) {
        const newConfigs = originalService.configs.map((config) =>
          queryRunner.manager.create(RemoteConfig, {
            ...config,
            id: undefined,
            service: savedService,
            serviceId: savedService.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        );
        await queryRunner.manager.save(newConfigs);
      }

      await queryRunner.commitTransaction();

      // 清除相关缓存
      await this.clearRelatedCache();
      await this.clearDiagnosisServiceCache();

      return savedService;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('复制远程服务失败:', error);
      throw new RpcException({
        code: 500,
        message: '复制服务失败',
        data: error,
      });
    } finally {
      await queryRunner.release();
    }
  }
}
