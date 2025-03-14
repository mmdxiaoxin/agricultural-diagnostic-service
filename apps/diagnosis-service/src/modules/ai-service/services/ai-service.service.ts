import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAiServiceDto } from '../dto/create-ai-service.dto';
import { UpdateAiServiceDto } from '../dto/update-ai-service.dto';
import { AiServiceAccessLog } from '../../../../../../libs/database/src/entities/ai-service-access-log.entity';
import { AiServiceConfig } from '../../../../../../libs/database/src/entities/ai-service-config.entity';
import { AiServiceLog } from '../../../../../../libs/database/src/entities/ai-service-log.entity';
import { AiService } from '../../../../../../libs/database/src/entities/ai-service.entity';

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
  ) {}

  // 创建AI服务
  async create(dto: CreateAiServiceDto): Promise<AiService> {
    const aiService = this.aiServiceRepository.create(dto);
    return await this.aiServiceRepository.save(aiService);
  }

  // 获取全部AI服务
  async findAll(): Promise<AiService[]> {
    return this.aiServiceRepository.find();
  }

  // 分页查询AI服务
  async findPaginated(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    return await this.aiServiceRepository.findAndCount({
      skip,
      take: pageSize,
    });
  }

  // 获取单个AI服务
  async findOne(serviceId: number) {
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
      throw new Error('AI Service not found');
    }

    Object.assign(aiService, dto);
    return this.aiServiceRepository.save(aiService);
  }

  // 删除AI服务
  async remove(serviceId: number): Promise<void> {
    const aiService = await this.aiServiceRepository.findOne({
      where: { serviceId },
    });
    if (!aiService) {
      throw new Error('AI Service not found');
    }

    await this.aiServiceRepository.remove(aiService);
  }
}
