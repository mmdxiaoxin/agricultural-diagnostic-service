import {
  AiService,
  AiServiceAccessLog,
  AiServiceConfig,
  AiServiceLog,
} from '@app/database/entities';
import { CreateAiServiceDto } from '@common/dto/ai-service/create-ai-service.dto';
import { UpdateAiServiceDto } from '@common/dto/ai-service/update-ai-service.dto';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
@Injectable()
export class AiServiceService {
  constructor(
    @InjectRepository(AiService)
    private aiServiceRepository: Repository<AiService>,

    @InjectRepository(AiServiceLog)
    private aiServiceLogRepository: Repository<AiServiceLog>,

    @InjectRepository(AiServiceConfig)
    private aiServiceConfigRepository: Repository<AiServiceConfig>,

    @InjectRepository(AiServiceAccessLog)
    private aiServiceAccessLogRepository: Repository<AiServiceAccessLog>,

    private dataSource: DataSource,
  ) {}

  // 创建AI服务
  async create(dto: CreateAiServiceDto): Promise<AiService> {
    const aiService = this.aiServiceRepository.create(dto);
    return await this.aiServiceRepository.save(aiService);
  }

  // 获取全部AI服务
  async getAi(): Promise<AiService[]> {
    return this.aiServiceRepository.find();
  }

  // 分页查询AI服务
  async getAiList(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    return await this.aiServiceRepository.findAndCount({
      skip,
      take: pageSize,
    });
  }

  // 获取单个AI服务
  async getAIById(serviceId: number) {
    return this.aiServiceRepository.findOne({
      where: { serviceId },
      relations: ['aiServiceLogs', 'aiServiceConfigs', 'aiServiceAccessLogs'],
    });
  }

  // 更新AI服务
  async update(serviceId: number, dto: UpdateAiServiceDto): Promise<AiService> {
    const aiService = await this.aiServiceRepository.findOne({
      where: { serviceId },
    });
    if (!aiService) {
      throw new RpcException('AI Service not found');
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
      // 查找服务及其关联数据
      const aiService = await queryRunner.manager.findOne(AiService, {
        where: { serviceId },
        relations: [
          'aiServiceLogs',
          'aiServiceConfigs',
          'aiServiceAccessLogs',
          'supportModels',
        ],
      });

      if (!aiService) {
        throw new RpcException({
          code: 404,
          message: '未找到当前服务',
        });
      }

      // 删除关联的日志记录
      if (aiService.aiServiceLogs?.length) {
        await queryRunner.manager.remove(aiService.aiServiceLogs);
      }

      // 删除关联的配置记录
      if (aiService.aiServiceConfigs?.length) {
        await queryRunner.manager.remove(aiService.aiServiceConfigs);
      }

      // 删除关联的访问日志记录
      if (aiService.aiServiceAccessLogs?.length) {
        await queryRunner.manager.remove(aiService.aiServiceAccessLogs);
      }

      // 清除与模型的关联关系
      if (aiService.supportModels?.length) {
        aiService.supportModels = [];
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
  async copy(serviceId: number): Promise<AiService> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 查找原始服务及其配置
      const originalService = await queryRunner.manager.findOne(AiService, {
        where: { serviceId },
        relations: ['aiServiceConfigs', 'supportModels'],
      });

      if (!originalService) {
        throw new RpcException({
          code: 404,
          message: '未找到当前服务',
        });
      }

      // 创建新的服务实例
      const newService = queryRunner.manager.create(AiService, {
        ...originalService,
        serviceId: undefined,
        serviceName: `${originalService.serviceName} - 复制`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 保存新服务
      const savedService = await queryRunner.manager.save(newService);

      // 复制配置记录
      if (originalService.aiServiceConfigs?.length) {
        const newConfigs = originalService.aiServiceConfigs.map((config) =>
          queryRunner.manager.create(AiServiceConfig, {
            ...config,
            id: undefined,
            service: savedService,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        );
        await queryRunner.manager.save(newConfigs);
      }

      // 复制模型关联关系
      if (originalService.supportModels?.length) {
        savedService.supportModels = originalService.supportModels;
        await queryRunner.manager.save(savedService);
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
