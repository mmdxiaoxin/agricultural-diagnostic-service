import { Crop, Disease } from '@app/database/entities';
import { RedisService } from '@app/redis';
import { CreateDiseaseDto } from '@common/dto/knowledge/create-disease.dto';
import { UpdateKnowledgeDto } from '@common/dto/knowledge/update-knowledge.dto';
import { PageQueryDateDto } from '@common/dto/page-query-date.dto';
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { formatResponse } from '@shared/helpers/response.helper';
import { Repository } from 'typeorm';

@Injectable()
export class DiseaseService {
  private readonly logger = new Logger(DiseaseService.name);
  private readonly CACHE_TTL = 3600; // 缓存时间1小时

  // 缓存键前缀
  private readonly CACHE_KEYS = {
    DISEASE: 'disease',
    DISEASE_LIST: 'disease:list',
    DISEASE_SYMPTOMS: 'disease:symptoms',
  } as const;

  constructor(
    @InjectRepository(Disease) private diseaseRepository: Repository<Disease>,
    @InjectRepository(Crop) private cropRepository: Repository<Crop>,
    private readonly redisService: RedisService,
  ) {}

  // 生成缓存键的辅助方法
  private generateCacheKey(
    type: keyof typeof this.CACHE_KEYS,
    ...args: any[]
  ): string {
    const prefix = this.CACHE_KEYS[type];
    switch (type) {
      case 'DISEASE':
        return `${prefix}:${args[0]}`; // disease:id
      case 'DISEASE_LIST':
        return `${prefix}:${args[0]}:${args[1]}`; // disease:list:page:pageSize
      case 'DISEASE_SYMPTOMS':
        return `${prefix}:${args[0]}`; // disease:symptoms:id
      default:
        return prefix;
    }
  }

  // 清除相关缓存
  private async clearRelatedCache(diseaseId?: number) {
    const patterns = [`${this.CACHE_KEYS.DISEASE_LIST}:*`];

    if (diseaseId) {
      patterns.push(
        `${this.CACHE_KEYS.DISEASE}:${diseaseId}`,
        `${this.CACHE_KEYS.DISEASE_SYMPTOMS}:${diseaseId}`,
      );
    }

    for (const pattern of patterns) {
      const keys = await this.redisService.getClient().keys(pattern);
      if (keys.length > 0) {
        await this.redisService.getClient().del(...keys);
      }
    }
  }

  // 创建病害
  async create(dto: CreateDiseaseDto) {
    const crop = await this.cropRepository.findOne({
      where: { id: dto.cropId },
    });
    if (!crop) {
      this.logger.error(`Crop with ID ${dto.cropId} not found`);
      throw new RpcException({
        code: 404,
        message: `Crop with ID ${dto.cropId} not found`,
      });
    }
    const disease = this.diseaseRepository.create({ ...dto, crop });
    await this.diseaseRepository.save(disease);
    await this.clearRelatedCache();
    return formatResponse(201, disease, '病害创建成功');
  }

  // 获取所有病害
  async findAll() {
    const cacheKey = this.generateCacheKey('DISEASE_LIST', 'all');
    const cachedResult = await this.redisService.get<Disease[]>(cacheKey);

    if (cachedResult) {
      return formatResponse(200, cachedResult, '病害列表获取成功（缓存）');
    }

    const diseases = await this.diseaseRepository.find({
      relations: [
        'crop',
        'symptoms',
        'treatments',
        'environmentFactors',
        'diagnosisRules',
      ],
    });

    // 缓存结果
    await this.redisService.set(cacheKey, diseases, this.CACHE_TTL);

    return formatResponse(200, diseases, '病害列表获取成功');
  }

  // 获取病害列表
  async findList(query: PageQueryDateDto) {
    const { page = 1, pageSize = 10 } = query;
    const cacheKey = this.generateCacheKey('DISEASE_LIST', page, pageSize);

    const cachedResult = await this.redisService.get<{
      list: Disease[];
      total: number;
      page: number;
      pageSize: number;
    }>(cacheKey);

    if (cachedResult) {
      return formatResponse(200, cachedResult, '病害列表获取成功（缓存）');
    }

    const [diseases, total] = await this.diseaseRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      relations: [
        'crop',
        'symptoms',
        'treatments',
        'environmentFactors',
        'diagnosisRules',
      ],
    });

    const result = { list: diseases, total, page, pageSize };

    // 缓存结果
    await this.redisService.set(cacheKey, result, this.CACHE_TTL);

    return formatResponse(200, result, '病害列表获取成功');
  }

  // 获取单个病害详情
  async findById(id: number) {
    const cacheKey = this.generateCacheKey('DISEASE', id);
    const cachedResult = await this.redisService.get<Disease>(cacheKey);

    if (cachedResult) {
      return formatResponse(200, cachedResult, '病害详情获取成功（缓存）');
    }

    const disease = await this.diseaseRepository.findOne({
      where: { id },
      relations: [
        'crop',
        'symptoms',
        'treatments',
        'environmentFactors',
        'diagnosisRules',
      ],
    });

    if (!disease) {
      this.logger.error(`Disease with ID ${id} not found`);
      throw new RpcException({
        code: 404,
        message: `Disease with ID ${id} not found`,
      });
    }

    // 缓存结果
    await this.redisService.set(cacheKey, disease, this.CACHE_TTL);

    return formatResponse(200, disease, '病害详情获取成功');
  }

  // 获取病害症状
  async findSymptoms(id: number) {
    const cacheKey = this.generateCacheKey('DISEASE_SYMPTOMS', id);
    const cachedResult = await this.redisService.get<any[]>(cacheKey);

    if (cachedResult) {
      return formatResponse(200, cachedResult, '病害症状获取成功（缓存）');
    }

    const disease = await this.diseaseRepository.findOne({
      where: { id },
      relations: ['symptoms'],
    });

    if (!disease) {
      this.logger.error(`Disease with ID ${id} not found`);
      throw new RpcException({
        code: 404,
        message: `Disease with ID ${id} not found`,
      });
    }

    // 缓存结果
    await this.redisService.set(cacheKey, disease.symptoms, this.CACHE_TTL);

    return formatResponse(200, disease.symptoms, '病害症状获取成功');
  }

  // 更新病害信息
  async update(id: number, dto: UpdateKnowledgeDto) {
    const disease = await this.diseaseRepository.findOne({ where: { id } });
    if (!disease) {
      this.logger.error(`Disease with ID ${id} not found`);
      throw new RpcException({
        code: 404,
        message: `Disease with ID ${id} not found`,
      });
    }
    Object.assign(disease, dto);
    await this.diseaseRepository.save(disease);
    await this.clearRelatedCache(id);
    return formatResponse(200, disease, '病害更新成功');
  }

  // 删除病害
  async remove(id: number) {
    const disease = await this.diseaseRepository.findOne({ where: { id } });
    if (!disease) {
      this.logger.error(`Disease with ID ${id} not found`);
      throw new RpcException({
        code: 404,
        message: `Disease with ID ${id} not found`,
      });
    }
    await this.diseaseRepository.remove(disease);
    await this.clearRelatedCache(id);
    return formatResponse(204, null, '病害删除成功');
  }
}
