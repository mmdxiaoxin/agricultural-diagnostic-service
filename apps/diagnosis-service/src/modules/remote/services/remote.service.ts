import { RemoteService, RemoteInterface } from '@app/database/entities';
import { CreateAiServiceDto } from '@common/dto/ai-service/create-remote-service.dto';
import { UpdateAiServiceDto } from '@common/dto/ai-service/update-remote-service.dto';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class RemoteServiceService {
  constructor(
    @InjectRepository(RemoteService)
    private aiServiceRepository: Repository<RemoteService>,
    private dataSource: DataSource,
  ) {}

  // 获取全部AI服务
  async getRemote(): Promise<RemoteService[]> {
    return this.aiServiceRepository.find();
  }

  // 分页查询AI服务
  async getRemoteList(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    return await this.aiServiceRepository.findAndCount({
      skip,
      take: pageSize,
    });
  }

  // 获取单个AI服务
  async getRemoteById(serviceId: number) {
    return this.aiServiceRepository.findOne({
      where: { id: serviceId },
      relations: ['interfaces'],
    });
  }

  // 创建AI服务
  async create(dto: CreateAiServiceDto): Promise<RemoteService> {
    const aiService = this.aiServiceRepository.create(dto);
    return await this.aiServiceRepository.save(aiService);
  }

  // 更新AI服务
  async update(
    serviceId: number,
    dto: UpdateAiServiceDto,
  ): Promise<RemoteService> {
    const aiService = await this.aiServiceRepository.findOne({
      where: { id: serviceId },
    });
    if (!aiService) {
      throw new RpcException({
        code: 404,
        message: '未找到当前服务',
      });
    }

    Object.assign(aiService, dto);
    return this.aiServiceRepository.save(aiService);
  }

  // 删除AI服务
  async remove(serviceId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 查找服务及其配置
      const aiService = await queryRunner.manager.findOne(RemoteService, {
        where: { id: serviceId },
        relations: ['interfaces'],
      });

      if (!aiService) {
        throw new RpcException({
          code: 404,
          message: '未找到当前服务',
        });
      }

      // 删除关联的接口
      if (aiService.interfaces?.length) {
        await queryRunner.manager.remove(aiService.interfaces);
      }

      // 删除服务本身
      await queryRunner.manager.remove(aiService);

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

  // 复制AI服务
  async copy(serviceId: number): Promise<RemoteService> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 查找原始服务及其配置
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
        serviceId: undefined,
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
            service: savedService,
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
