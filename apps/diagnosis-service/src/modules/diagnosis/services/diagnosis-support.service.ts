import { DiagnosisSupport } from '@app/database/entities/diagnosis-support.entity';
import { RedisService } from '@app/redis';
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { formatResponse } from '@shared/helpers/response.helper';
import { Repository } from 'typeorm';

@Injectable()
export class DiagnosisSupportService {
  private readonly logger = new Logger(DiagnosisSupportService.name);
  private readonly CACHE_TTL = 300; // 缓存时间5分钟

  // 缓存键前缀
  private readonly CACHE_KEYS = {
    DIAGNOSIS_SUPPORT: 'diagnosis:support',
    DIAGNOSIS_SUPPORT_LIST: 'diagnosis:support:list',
  } as const;

  constructor(
    @InjectRepository(DiagnosisSupport)
    private readonly diagnosisSupportRepository: Repository<DiagnosisSupport>,
    private readonly redisService: RedisService,
  ) {}

  // 生成缓存键的辅助方法
  private generateCacheKey(
    type: keyof typeof this.CACHE_KEYS,
    ...args: any[]
  ): string {
    const prefix = this.CACHE_KEYS[type];
    switch (type) {
      case 'DIAGNOSIS_SUPPORT':
        return `${prefix}:${args[0]}`; // diagnosis:support:id
      case 'DIAGNOSIS_SUPPORT_LIST':
        return `${prefix}:${args[0]}:${args[1]}`; // diagnosis:support:list:page:pageSize
      default:
        return prefix;
    }
  }

  // 清除相关缓存
  private async clearRelatedCache(supportId?: number) {
    const patterns = [`${this.CACHE_KEYS.DIAGNOSIS_SUPPORT_LIST}:*`];

    if (supportId) {
      patterns.push(`${this.CACHE_KEYS.DIAGNOSIS_SUPPORT}:${supportId}`);
    }

    for (const pattern of patterns) {
      const keys = await this.redisService.getClient().keys(pattern);
      if (keys.length > 0) {
        await this.redisService.getClient().del(...keys);
      }
    }
  }

  // 创建诊断支持配置
  async create(
    key: string,
    value: { serviceId: number; configId: number },
    description: string,
  ) {
    try {
      const support = this.diagnosisSupportRepository.create({
        key,
        value,
        description,
      });
      const result = await this.diagnosisSupportRepository.save(support);

      // 清除相关缓存
      await this.clearRelatedCache(result.id);

      return formatResponse(200, result, '创建诊断支持配置成功');
    } catch (error) {
      this.logger.error('创建诊断支持配置失败:', error);
      throw new RpcException({
        code: 500,
        message: '创建诊断支持配置失败',
        data: error,
      });
    }
  }

  // 获取诊断支持配置列表
  async findAll() {
    try {
      const cacheKey = this.generateCacheKey('DIAGNOSIS_SUPPORT_LIST', 'all');
      const cachedResult =
        await this.redisService.get<DiagnosisSupport[]>(cacheKey);

      if (cachedResult) {
        return formatResponse(
          200,
          cachedResult,
          '获取诊断支持配置列表成功（缓存）',
        );
      }

      const supports = await this.diagnosisSupportRepository.find();

      // 缓存结果
      await this.redisService.set(cacheKey, supports, this.CACHE_TTL);

      return formatResponse(200, supports, '获取诊断支持配置列表成功');
    } catch (error) {
      this.logger.error('获取诊断支持配置列表失败:', error);
      throw new RpcException({
        code: 500,
        message: '获取诊断支持配置列表失败',
        data: error,
      });
    }
  }

  // 获取单个诊断支持配置
  async findOne(id: number) {
    try {
      const cacheKey = this.generateCacheKey('DIAGNOSIS_SUPPORT', id);
      const cachedResult =
        await this.redisService.get<DiagnosisSupport>(cacheKey);

      if (cachedResult) {
        return formatResponse(
          200,
          cachedResult,
          '获取诊断支持配置成功（缓存）',
        );
      }

      const support = await this.diagnosisSupportRepository.findOne({
        where: { id },
      });
      if (!support) {
        throw new RpcException({
          code: 404,
          message: '未找到诊断支持配置',
        });
      }

      // 缓存结果
      await this.redisService.set(cacheKey, support, this.CACHE_TTL);

      return formatResponse(200, support, '获取诊断支持配置成功');
    } catch (error) {
      this.logger.error('获取诊断支持配置失败:', error);
      throw new RpcException({
        code: error.code || 500,
        message: error.message || '获取诊断支持配置失败',
        data: error,
      });
    }
  }

  // 更新诊断支持配置
  async update(
    id: number,
    key: string,
    value: { serviceId: number; configId: number },
    description: string,
  ) {
    try {
      const support = await this.diagnosisSupportRepository.findOne({
        where: { id },
      });
      if (!support) {
        throw new RpcException({
          code: 404,
          message: '未找到诊断支持配置',
        });
      }

      support.key = key;
      support.value = value;
      support.description = description;

      const result = await this.diagnosisSupportRepository.save(support);

      // 清除相关缓存
      await this.clearRelatedCache(id);

      return formatResponse(200, result, '更新诊断支持配置成功');
    } catch (error) {
      this.logger.error('更新诊断支持配置失败:', error);
      throw new RpcException({
        code: error.code || 500,
        message: error.message || '更新诊断支持配置失败',
        data: error,
      });
    }
  }

  // 删除诊断支持配置
  async remove(id: number) {
    try {
      const support = await this.diagnosisSupportRepository.findOne({
        where: { id },
      });
      if (!support) {
        throw new RpcException({
          code: 404,
          message: '未找到诊断支持配置',
        });
      }

      await this.diagnosisSupportRepository.remove(support);

      // 清除相关缓存
      await this.clearRelatedCache(id);

      return formatResponse(200, null, '删除诊断支持配置成功');
    } catch (error) {
      this.logger.error('删除诊断支持配置失败:', error);
      throw new RpcException({
        code: error.code || 500,
        message: error.message || '删除诊断支持配置失败',
        data: error,
      });
    }
  }
}
