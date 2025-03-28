import { RemoteConfig, RemoteService } from '@app/database/entities';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class RemoteConfigService {
  constructor(
    @InjectRepository(RemoteConfig)
    private remoteConfigRepository: Repository<RemoteConfig>,
    @InjectRepository(RemoteService)
    private remoteServiceRepository: Repository<RemoteService>,
    private dataSource: DataSource,
  ) {}

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
      });

      if (!config) {
        throw new RpcException({
          code: 404,
          message: '未找到当前配置',
        });
      }

      await queryRunner.manager.remove(config);
      await queryRunner.commitTransaction();
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
}
