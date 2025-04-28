import { Crop } from '@app/database/entities';
import { RedisService } from '@app/redis';
import { CreateCropDto } from '@common/dto/knowledge/create-crop.dto';
import { PageQueryKeywordsDto } from '@common/dto/knowledge/page-query-keywords.dto';
import { UpdateCropDto } from '@common/dto/knowledge/update-crop.dto';
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { formatResponse } from '@shared/helpers/response.helper';
import { Like, Repository } from 'typeorm';

@Injectable()
export class CropService {
  private readonly logger = new Logger(CropService.name);
  private readonly CACHE_TTL = 3600; // 缓存时间1小时

  // 缓存键前缀
  private readonly CACHE_KEYS = {
    CROP: 'crop',
    CROP_LIST: 'crop:list',
  } as const;

  constructor(
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
      case 'CROP':
        return `${prefix}:${args[0]}`; // crop:id
      case 'CROP_LIST':
        return `${prefix}:${args[0]}:${args[1]}:${args[2]}`; // crop:list:page:pageSize:keyword
      default:
        return prefix;
    }
  }

  // 清除相关缓存
  private async clearRelatedCache(cropId?: number) {
    const patterns = [`${this.CACHE_KEYS.CROP_LIST}:*`];

    if (cropId) {
      patterns.push(`${this.CACHE_KEYS.CROP}:${cropId}`);
    }

    for (const pattern of patterns) {
      const keys = await this.redisService.getClient().keys(pattern);
      if (keys.length > 0) {
        await this.redisService.getClient().del(...keys);
      }
    }
  }

  // 创建作物
  async create(dto: CreateCropDto) {
    const crop = this.cropRepository.create(dto);
    await this.cropRepository.save(crop);
    await this.clearRelatedCache();
    return formatResponse(201, crop, '作物创建成功');
  }

  // 获取所有作物
  async findAll() {
    const cacheKey = this.generateCacheKey('CROP_LIST', 'all');
    const cachedResult = await this.redisService.get<Crop[]>(cacheKey);

    if (cachedResult) {
      return formatResponse(200, cachedResult, '作物列表获取成功（缓存）');
    }

    const crops = await this.cropRepository.find();

    // 缓存结果
    await this.redisService.set(cacheKey, crops, this.CACHE_TTL);

    return formatResponse(200, crops, '作物列表获取成功');
  }

  // 获取作物列表
  async findList(query: PageQueryKeywordsDto) {
    const { page = 1, pageSize = 10, keyword = '' } = query;
    const cacheKey = this.generateCacheKey(
      'CROP_LIST',
      page,
      pageSize,
      keyword,
    );

    const cachedResult = await this.redisService.get<{
      list: Crop[];
      total: number;
      page: number;
      pageSize: number;
    }>(cacheKey);

    if (cachedResult) {
      return formatResponse(200, cachedResult, '作物列表获取成功（缓存）');
    }

    const [crops, total] = await this.cropRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where: [
        { name: Like(`%${keyword}%`) },
        { scientificName: Like(`%${keyword}%`) },
        { growthStage: Like(`%${keyword}%`) },
      ],
    });

    const result = { list: crops, total, page, pageSize };

    // 缓存结果
    await this.redisService.set(cacheKey, result, this.CACHE_TTL);

    return formatResponse(200, result, '作物列表获取成功');
  }

  // 根据ID获取作物
  async findById(id: number) {
    const cacheKey = this.generateCacheKey('CROP', id);
    const cachedResult = await this.redisService.get<Crop>(cacheKey);

    if (cachedResult) {
      return formatResponse(200, cachedResult, '作物获取成功（缓存）');
    }

    const crop = await this.cropRepository.findOne({ where: { id } });
    if (!crop) {
      throw new RpcException({
        code: 404,
        message: `Crop with ID ${id} not found`,
      });
    }

    // 缓存结果
    await this.redisService.set(cacheKey, crop, this.CACHE_TTL);

    return formatResponse(200, crop, '作物获取成功');
  }

  // 更新作物
  async update(id: number, dto: UpdateCropDto) {
    const crop = await this.cropRepository.findOne({ where: { id } });
    if (!crop) {
      this.logger.error(`Crop with ID ${id} not found`);
      throw new RpcException({
        code: 404,
        message: `Crop with ID ${id} not found`,
      });
    }
    Object.assign(crop, dto);
    await this.cropRepository.save(crop);
    await this.clearRelatedCache(id);
    return formatResponse(200, crop, '作物更新成功');
  }

  // 删除作物
  async remove(id: number) {
    const crop = await this.cropRepository.findOne({ where: { id } });
    if (!crop) {
      this.logger.error(`Crop with ID ${id} not found`);
      throw new RpcException({
        code: 404,
        message: `Crop with ID ${id} not found`,
      });
    }
    await this.cropRepository.remove(crop);
    await this.clearRelatedCache(id);
    return formatResponse(204, null, '作物删除成功');
  }
}
