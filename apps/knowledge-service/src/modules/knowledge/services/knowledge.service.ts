import { Crop, Disease } from '@app/database/entities';
import { RedisService } from '@app/redis';
import { CreateKnowledgeDto } from '@common/dto/knowledge/create-knowledge.dto';
import { PageQueryKnowledgeDto } from '@common/dto/knowledge/page-query-knowledge.dto';
import { UpdateKnowledgeDto } from '@common/dto/knowledge/update-knowledge.dto';
import { Prediction } from '@common/types/diagnosis/predict';
import { DiagnosisRuleConfig, MatchResult } from '@common/types/knowledge/rule';
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { formatResponse } from '@shared/helpers/response.helper';
import { get, isObject, isString } from 'lodash-es';
import { Like, Repository } from 'typeorm';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);
  private readonly CACHE_TTL = 3600; // 缓存时间1小时

  // 缓存键前缀
  private readonly CACHE_KEYS = {
    DISEASE: 'disease',
    DISEASE_LIST: 'disease:list',
    DISEASE_MATCH: 'disease:match',
    DISEASE_STATS: 'disease:match:stats',
  } as const;

  constructor(
    @InjectRepository(Disease)
    private diseaseRepository: Repository<Disease>,
    @InjectRepository(Crop)
    private cropRepository: Repository<Crop>,
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
        return `${prefix}:${args[0]}:${args[1]}:${args[2]}:${args[3]}`; // disease:list:page:pageSize:keyword:cropId
      case 'DISEASE_MATCH':
        return this.generateMatchCacheKey(args[0]);
      case 'DISEASE_STATS':
        return prefix;
      default:
        return prefix;
    }
  }

  // 生成匹配缓存键
  private generateMatchCacheKey(query: string | Record<string, any>): string {
    if (isString(query)) {
      return `${this.CACHE_KEYS.DISEASE_MATCH}:${query}`;
    }
    const searchText = get(query, 'searchText') as string;
    if (searchText && searchText.trim()) {
      return `${this.CACHE_KEYS.DISEASE_MATCH}:${searchText.trim()}`;
    }
    if (query.predictions) {
      return `${this.CACHE_KEYS.DISEASE_MATCH}:predictions:${JSON.stringify(query.predictions)}`;
    }
    return `${this.CACHE_KEYS.DISEASE_MATCH}:${JSON.stringify(query)}`;
  }

  // 清除相关缓存
  private async clearRelatedCache(diseaseId?: number) {
    const patterns = [
      `${this.CACHE_KEYS.DISEASE_LIST}:*`,
      this.CACHE_KEYS.DISEASE_MATCH,
      this.CACHE_KEYS.DISEASE_STATS,
    ];

    if (diseaseId) {
      patterns.push(`${this.CACHE_KEYS.DISEASE}:${diseaseId}`);
    }

    for (const pattern of patterns) {
      const keys = await this.redisService.getClient().keys(pattern);
      if (keys.length > 0) {
        await this.redisService.getClient().del(...keys);
      }
    }
  }

  // 创建知识
  async create(dto: CreateKnowledgeDto) {
    const queryRunner =
      this.diseaseRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 验证作物是否存在
      const crop = await this.cropRepository.findOne({
        where: { id: dto.cropId },
      });
      if (!crop) {
        throw new RpcException({
          code: 404,
          message: `Crop with ID ${dto.cropId} not found`,
        });
      }

      // 2. 创建病害基本信息
      const disease = this.diseaseRepository.create({
        name: dto.name,
        alias: dto.alias,
        crop,
        cause: dto.cause,
        transmission: dto.transmission,
        difficultyLevel: dto.difficultyLevel,
      });

      // 3. 保存病害基本信息
      const savedDisease = await queryRunner.manager.save(disease);

      // 4. 处理症状
      if (dto.symptoms && dto.symptoms.length > 0) {
        const symptoms = dto.symptoms.map((symptom) => ({
          ...symptom,
          disease: savedDisease,
        }));
        await queryRunner.manager.save('symptom', symptoms);
      }

      // 5. 处理治疗方案
      if (dto.treatments && dto.treatments.length > 0) {
        const treatments = dto.treatments.map((treatment) => ({
          ...treatment,
          disease: savedDisease,
        }));
        await queryRunner.manager.save('treatment', treatments);
      }

      // 6. 处理环境因素
      if (dto.environmentFactors && dto.environmentFactors.length > 0) {
        const environmentFactors = dto.environmentFactors.map((factor) => ({
          ...factor,
          disease: savedDisease,
        }));
        await queryRunner.manager.save(
          'environment_factor',
          environmentFactors,
        );
      }

      // 7. 处理诊断规则
      if (dto.diagnosisRules && dto.diagnosisRules.length > 0) {
        const diagnosisRules = dto.diagnosisRules.map((rule) => ({
          ...rule,
          disease: savedDisease,
        }));
        await queryRunner.manager.save('diagnosis_rule', diagnosisRules);
      }

      // 8. 重新获取完整的病害信息（包含所有关联数据）
      const completeDisease = await queryRunner.manager.findOne(Disease, {
        where: { id: savedDisease.id },
        relations: [
          'crop',
          'symptoms',
          'treatments',
          'environmentFactors',
          'diagnosisRules',
        ],
      });

      await queryRunner.commitTransaction();
      await this.clearRelatedCache(savedDisease.id);
      return formatResponse(201, completeDisease, '知识创建成功');
    } catch (error) {
      this.logger.error(error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 获取所有知识
  async findAll() {
    const cacheKey = this.generateCacheKey('DISEASE_LIST', 'all');
    const cachedResult = await this.redisService.get<Disease[]>(cacheKey);

    if (cachedResult) {
      return formatResponse(200, cachedResult, '知识列表获取成功（缓存）');
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

    return formatResponse(200, diseases, '知识列表获取成功');
  }

  // 获取知识列表
  async findList(query: PageQueryKnowledgeDto) {
    const { page = 1, pageSize = 10, keyword, cropId } = query;
    const cacheKey = this.generateCacheKey(
      'DISEASE_LIST',
      page,
      pageSize,
      keyword || '',
      cropId || '',
    );

    const cachedResult = await this.redisService.get<{
      list: Disease[];
      total: number;
      page: number;
      pageSize: number;
    }>(cacheKey);

    if (cachedResult) {
      return formatResponse(200, cachedResult, '知识列表获取成功（缓存）');
    }

    const queryBuilder = this.diseaseRepository
      .createQueryBuilder('disease')
      .leftJoinAndSelect('disease.crop', 'crop')
      .leftJoinAndSelect('disease.symptoms', 'symptoms')
      .leftJoinAndSelect('disease.treatments', 'treatments')
      .leftJoinAndSelect('disease.environmentFactors', 'environmentFactors')
      .leftJoinAndSelect('disease.diagnosisRules', 'diagnosisRules');

    if (keyword) {
      queryBuilder.where([
        { name: Like(`%${keyword}%`) },
        { alias: Like(`%${keyword}%`) },
      ]);
    }

    if (cropId) {
      queryBuilder.andWhere('disease.cropId = :cropId', { cropId });
    }

    const [diseases, total] = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    const result = { list: diseases, total, page, pageSize };

    // 缓存结果
    await this.redisService.set(cacheKey, result, this.CACHE_TTL);

    return formatResponse(200, result, '知识列表获取成功');
  }

  // 根据ID获取知识
  async findById(id: number) {
    const cacheKey = this.generateCacheKey('DISEASE', id);
    const cachedResult = await this.redisService.get<Disease>(cacheKey);

    if (cachedResult) {
      return formatResponse(200, cachedResult, '知识详情获取成功（缓存）');
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
      throw new RpcException({
        code: 404,
        message: `Knowledge with ID ${id} not found`,
      });
    }

    // 缓存结果
    await this.redisService.set(cacheKey, disease, this.CACHE_TTL);

    return formatResponse(200, disease, '知识详情获取成功');
  }

  // 更新知识
  async update(id: number, dto: UpdateKnowledgeDto) {
    const queryRunner =
      this.diseaseRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 验证病害是否存在
      const disease = await this.diseaseRepository.findOne({
        where: { id },
        relations: [
          'symptoms',
          'treatments',
          'environmentFactors',
          'diagnosisRules',
        ],
      });
      if (!disease) {
        throw new RpcException({
          code: 404,
          message: `Knowledge with ID ${id} not found`,
        });
      }

      // 2. 如果作物ID发生变化，验证新作物是否存在
      if (dto.cropId && dto.cropId !== disease.cropId) {
        const crop = await this.cropRepository.findOne({
          where: { id: dto.cropId },
        });
        if (!crop) {
          throw new RpcException({
            code: 404,
            message: `Crop with ID ${dto.cropId} not found`,
          });
        }
        disease.crop = crop;
      }

      // 3. 更新基本信息
      Object.assign(disease, {
        name: dto.name,
        alias: dto.alias,
        cause: dto.cause,
        transmission: dto.transmission,
        difficultyLevel: dto.difficultyLevel,
      });

      // 4. 保存更新后的病害信息
      const updatedDisease = await queryRunner.manager.save(disease);

      // 5. 处理症状更新
      if (dto.symptoms) {
        // 删除原有症状
        if (disease.symptoms && disease.symptoms.length > 0) {
          await queryRunner.manager.remove(disease.symptoms);
        }
        // 创建新的症状
        if (dto.symptoms.length > 0) {
          const symptoms = dto.symptoms.map((symptom) => ({
            ...symptom,
            disease: updatedDisease,
          }));
          await queryRunner.manager.save('symptom', symptoms);
        }
      }

      // 6. 处理治疗方案更新
      if (dto.treatments) {
        // 删除原有治疗方案
        if (disease.treatments && disease.treatments.length > 0) {
          await queryRunner.manager.remove(disease.treatments);
        }
        // 创建新的治疗方案
        if (dto.treatments.length > 0) {
          const treatments = dto.treatments.map((treatment) => ({
            ...treatment,
            disease: updatedDisease,
          }));
          await queryRunner.manager.save('treatment', treatments);
        }
      }

      // 7. 处理环境因素更新
      if (dto.environmentFactors) {
        // 删除原有环境因素
        if (
          disease.environmentFactors &&
          disease.environmentFactors.length > 0
        ) {
          await queryRunner.manager.remove(disease.environmentFactors);
        }
        // 创建新的环境因素
        if (dto.environmentFactors.length > 0) {
          const environmentFactors = dto.environmentFactors.map((factor) => ({
            ...factor,
            disease: updatedDisease,
          }));
          await queryRunner.manager.save(
            'environment_factor',
            environmentFactors,
          );
        }
      }

      // 8. 处理诊断规则更新
      if (dto.diagnosisRules) {
        // 删除原有诊断规则
        if (disease.diagnosisRules && disease.diagnosisRules.length > 0) {
          await queryRunner.manager.remove(disease.diagnosisRules);
        }
        // 创建新的诊断规则
        if (dto.diagnosisRules.length > 0) {
          const diagnosisRules = dto.diagnosisRules.map((rule) => ({
            ...rule,
            disease: updatedDisease,
          }));
          await queryRunner.manager.save('diagnosis_rule', diagnosisRules);
        }
      }

      // 9. 重新获取完整的病害信息（包含所有关联数据）
      const completeDisease = await queryRunner.manager.findOne(Disease, {
        where: { id: updatedDisease.id },
        relations: [
          'crop',
          'symptoms',
          'treatments',
          'environmentFactors',
          'diagnosisRules',
        ],
      });

      await queryRunner.commitTransaction();
      await this.clearRelatedCache(updatedDisease.id);
      return formatResponse(200, completeDisease, '知识更新成功');
    } catch (error) {
      this.logger.error(error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 删除知识
  async remove(id: number) {
    const queryRunner =
      this.diseaseRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const disease = await this.diseaseRepository.findOne({ where: { id } });
      if (!disease) {
        throw new RpcException({
          code: 404,
          message: `Knowledge with ID ${id} not found`,
        });
      }

      await queryRunner.manager.remove(disease);

      await queryRunner.commitTransaction();
      await this.clearRelatedCache(id);
      return formatResponse(204, null, '知识删除成功');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 匹配知识
  async match(query: string | Record<string, any>) {
    // 1. 尝试从缓存获取结果
    const cacheKey = this.generateMatchCacheKey(query);
    const cachedResult = await this.redisService.get<MatchResult[]>(cacheKey);
    if (cachedResult && cachedResult.length > 0) {
      return formatResponse(200, cachedResult, '知识匹配成功（缓存）');
    }

    // 2. 处理查询条件
    let predictions: Prediction[] = [];
    if (isObject(query) && query.predictions) {
      predictions = query.predictions;
    }

    // 3. 获取所有疾病及其规则
    const diseases = await this.diseaseRepository
      .createQueryBuilder('disease')
      .leftJoinAndSelect('disease.diagnosisRules', 'diagnosisRules')
      .leftJoinAndSelect('disease.crop', 'crop')
      .getMany();

    // 4. 执行匹配
    const matchResults = await this.matchPredictions(diseases, predictions);

    // 5. 缓存结果
    if (matchResults.length > 0) {
      await this.redisService.set(cacheKey, matchResults, this.CACHE_TTL);
    }

    return formatResponse(200, matchResults, '知识匹配成功');
  }

  // 匹配预测结果
  private async matchPredictions(
    diseases: Disease[],
    predictions: Prediction[],
  ): Promise<MatchResult[]> {
    const results: MatchResult[] = [];

    for (const disease of diseases) {
      const rules = disease.diagnosisRules || [];
      let totalScore = 0;
      const matchedRules: DiagnosisRuleConfig[] = [];

      for (const rule of rules) {
        const score = this.calculateRuleScore(rule.config, predictions);
        if (score > 0) {
          totalScore += score * (rule.weight || 1);
          matchedRules.push(rule.config);
        }
      }

      if (totalScore > 0) {
        results.push({
          disease,
          score: totalScore,
          matchedRules,
        });
      }
    }

    // 按分数排序
    return results.sort((a, b) => b.score - a.score);
  }

  // 计算规则分数
  private calculateRuleScore(
    rule: DiagnosisRuleConfig,
    predictions: Prediction[],
  ): number {
    switch (rule.type) {
      case 'exact':
        return predictions.some((p) => p.class_name === rule.value) ? 1 : 0;

      case 'fuzzy':
        return predictions.some(
          (p) => this.calculateSimilarity(p.class_name, rule.value) > 0.8,
        )
          ? 0.8
          : 0;

      case 'regex':
        const regex = new RegExp(rule.value);
        return predictions.some((p) => regex.test(p.class_name)) ? 0.9 : 0;

      case 'contains':
        return predictions.some((p) =>
          p.class_name.toLowerCase().includes(rule.value.toLowerCase()),
        )
          ? 0.7
          : 0;

      default:
        return 0;
    }
  }

  // 计算字符串相似度
  private calculateSimilarity(str1: string, str2: string): number {
    // 实现字符串相似度算法，如 Levenshtein 距离
    // 这里使用简化的实现
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    return 0;
  }

  // 批量匹配方法
  async batchMatch(queries: (string | Record<string, any>)[]) {
    const results: MatchResult[][] = [];

    for (const query of queries) {
      const matchResult = await this.match(query);
      results.push(matchResult.data || []);
    }

    return formatResponse(200, results, '批量知识匹配成功');
  }

  // 获取匹配统计
  async getMatchStats() {
    const statsKey = this.generateCacheKey('DISEASE_STATS');
    const stats = (await this.redisService.get<{
      totalMatches: number;
      cacheHits: number;
      ruleMatches: number;
    }>(statsKey)) || {
      totalMatches: 0,
      cacheHits: 0,
      ruleMatches: 0,
    };

    return formatResponse(200, stats, '匹配统计获取成功');
  }

  // 定期清理缓存
  @Cron('0 0 * * *') // 每天凌晨执行
  async cleanupCache() {
    const pattern = 'disease:match:*';
    const keys = await this.redisService.getClient().keys(pattern);
    for (const key of keys) {
      const ttl = await this.redisService.getClient().ttl(key);
      if (ttl < 0) {
        // 已过期的键
        await this.redisService.del(key);
      }
    }
  }
}
