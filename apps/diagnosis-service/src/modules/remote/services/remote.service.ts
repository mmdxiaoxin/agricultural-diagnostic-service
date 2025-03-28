import {
  RemoteService,
  RemoteInterface,
  RemoteConfig,
} from '@app/database/entities';
import { CreateRemoteServiceDto } from '@common/dto/remote/create-remote-service.dto';
import { UpdateRemoteServiceDto } from '@common/dto/remote/update-remote-service.dto';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class RemoteServiceService {
  constructor(
    @InjectRepository(RemoteService)
    private remoteServiceRepository: Repository<RemoteService>,
    private dataSource: DataSource,
  ) {}

  // 获取全部远程服务
  async find(): Promise<RemoteService[]> {
    return this.remoteServiceRepository.find({
      relations: ['interfaces'],
    });
  }

  // 分页查询远程服务
  async findList(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    return await this.remoteServiceRepository.findAndCount({
      skip,
      take: pageSize,
      relations: ['interfaces'],
    });
  }

  // 获取单个远程服务
  async findById(serviceId: number) {
    return this.remoteServiceRepository.findOne({
      where: { id: serviceId },
      relations: ['interfaces'],
    });
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
      return savedService;
    } catch (error) {
      await queryRunner.rollbackTransaction();
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
      return updatedService;
    } catch (error) {
      await queryRunner.rollbackTransaction();
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
      // 查找服务及其接口
      const remoteService = await queryRunner.manager.findOne(RemoteService, {
        where: { id: serviceId },
        relations: ['interfaces'],
      });

      if (!remoteService) {
        throw new RpcException({
          code: 404,
          message: '未找到当前服务',
        });
      }

      // 删除关联的接口
      if (remoteService.interfaces?.length) {
        await queryRunner.manager.remove(remoteService.interfaces);
      }

      // 删除服务本身
      await queryRunner.manager.remove(remoteService);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
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
      // 查找原始服务及其接口
      const originalService = await queryRunner.manager.findOne(RemoteService, {
        where: { id: serviceId },
        relations: ['interfaces'],
      });

      if (!originalService) {
        throw new RpcException({
          code: 404,
          message: '未找到当前服务',
        });
      }

      // 创建新的服务实例
      const newService = queryRunner.manager.create(RemoteService, {
        ...originalService,
        id: undefined,
        serviceName: `${originalService.serviceName} - 复制`,
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
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        );
        await queryRunner.manager.save(newInterfaces);
      }

      await queryRunner.commitTransaction();
      return savedService;
    } catch (error) {
      await queryRunner.rollbackTransaction();
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
