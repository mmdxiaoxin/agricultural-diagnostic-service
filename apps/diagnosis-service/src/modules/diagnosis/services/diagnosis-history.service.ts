import {
  DiagnosisHistory,
  DiagnosisHistoryStatus,
} from '@app/database/entities';
import { RedisService } from '@app/redis';
import { PageQueryDto } from '@common/dto/page-query.dto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { FILE_MESSAGE_PATTERNS } from '@shared/constants/file-message-patterns';
import { formatResponse } from '@shared/helpers/response.helper';
import { FILE_SERVICE_NAME } from 'config/microservice.config';
import { firstValueFrom } from 'rxjs';
import { DataSource, In, Repository } from 'typeorm';

@Injectable()
export class DiagnosisHistoryService {
  private readonly logger = new Logger(DiagnosisHistoryService.name);
  private readonly CACHE_TTL = 1800; // 缓存时间30分钟，考虑到诊断历史可能需要更频繁的更新

  // 缓存键前缀
  private readonly CACHE_KEYS = {
    DIAGNOSIS: 'diagnosis',
    DIAGNOSIS_LIST: 'diagnosis:list',
    DIAGNOSIS_STATUS: 'diagnosis:status',
    USER: 'user',
  } as const;

  constructor(
    @Inject(FILE_SERVICE_NAME)
    private readonly fileClient: ClientProxy,
    @InjectRepository(DiagnosisHistory)
    private readonly diagnosisRepository: Repository<DiagnosisHistory>,
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  // 生成缓存键的辅助方法
  private generateCacheKey(
    type: keyof typeof this.CACHE_KEYS,
    ...args: any[]
  ): string {
    const prefix = this.CACHE_KEYS[type];
    switch (type) {
      case 'DIAGNOSIS':
        return `${this.CACHE_KEYS.USER}:${args[1]}:${prefix}:${args[0]}`; // user:userId:diagnosis:id
      case 'DIAGNOSIS_LIST':
        if (args[1] === 'all') {
          return `${this.CACHE_KEYS.USER}:${args[0]}:${prefix}:all`; // user:userId:diagnosis:list:all
        }
        return `${this.CACHE_KEYS.USER}:${args[0]}:${prefix}:${args[1]}:${args[2]}`; // user:userId:diagnosis:list:page:pageSize
      case 'DIAGNOSIS_STATUS':
        return `${this.CACHE_KEYS.USER}:${args[1]}:${prefix}:${args[0]}`; // user:userId:diagnosis:status:id
      default:
        return prefix;
    }
  }

  // 清除相关缓存
  private async clearRelatedCache(userId: number, diagnosisId?: number) {
    const patterns = [
      `${this.CACHE_KEYS.USER}:${userId}:${this.CACHE_KEYS.DIAGNOSIS_LIST}:*`,
    ];

    if (diagnosisId) {
      patterns.push(
        `${this.CACHE_KEYS.USER}:${userId}:${this.CACHE_KEYS.DIAGNOSIS}:${diagnosisId}`,
        `${this.CACHE_KEYS.USER}:${userId}:${this.CACHE_KEYS.DIAGNOSIS_STATUS}:${diagnosisId}`,
      );
    }

    for (const pattern of patterns) {
      const keys = await this.redisService.getClient().keys(pattern);
      if (keys.length > 0) {
        await this.redisService.getClient().del(...keys);
      }
    }
  }

  // 初始化诊断数据
  async diagnosisHistoryCreate(userId: number, fileId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const diagnosisHistory = queryRunner.manager.create(DiagnosisHistory, {
        createdBy: userId,
        updatedBy: userId,
        status: DiagnosisHistoryStatus.PENDING,
      });
      diagnosisHistory.fileId = fileId;
      await queryRunner.manager.save(diagnosisHistory);
      await queryRunner.commitTransaction();

      // 清除相关缓存
      await this.clearRelatedCache(userId);

      return formatResponse(200, diagnosisHistory, '上传成功');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 获取诊断服务状态
  async diagnosisHistoryStatusGet(id: number, userId: number) {
    const cacheKey = this.generateCacheKey('DIAGNOSIS_STATUS', id, userId);
    const cachedResult =
      await this.redisService.get<DiagnosisHistory>(cacheKey);

    if (cachedResult) {
      return formatResponse(200, cachedResult, '获取诊断状态成功（缓存）');
    }

    const diagnosis = await this.diagnosisRepository.findOne({
      where: { id, createdBy: userId },
    });
    if (!diagnosis) {
      this.logger.error(`Diagnosis with ID ${id} not found`);
      throw new RpcException('未找到诊断记录');
    }

    // 缓存结果
    await this.redisService.set(cacheKey, diagnosis, this.CACHE_TTL);

    return formatResponse(200, diagnosis, '获取诊断状态成功');
  }

  // 获取诊断历史记录
  async diagnosisHistoryGet(userId: number) {
    const cacheKey = this.generateCacheKey('DIAGNOSIS_LIST', userId, 'all');
    const cachedResult =
      await this.redisService.get<DiagnosisHistory[]>(cacheKey);

    if (cachedResult) {
      return formatResponse(200, cachedResult, '获取诊断历史记录成功（缓存）');
    }

    const diagnosisHistory = await this.diagnosisRepository.find({
      where: { createdBy: userId },
      order: { createdAt: 'DESC' },
    });

    // 缓存结果
    await this.redisService.set(cacheKey, diagnosisHistory, this.CACHE_TTL);

    return formatResponse(200, diagnosisHistory, '获取诊断历史记录成功');
  }

  // 删除诊断记录
  async diagnosisHistoryDelete(id: number, userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 使用乐观锁获取诊断记录
      const diagnosis = await queryRunner.manager.findOne(DiagnosisHistory, {
        where: { id, createdBy: userId },
        select: ['id', 'fileId', 'version'],
      });

      if (!diagnosis) {
        this.logger.error(`Diagnosis with ID ${id} not found`);
        throw new RpcException({
          code: 404,
          message: '未找到诊断记录',
        });
      }

      // 先删除文件
      try {
        await firstValueFrom(
          this.fileClient.send(
            { cmd: FILE_MESSAGE_PATTERNS.FILE_DELETE },
            {
              fileId: diagnosis.fileId,
              userId,
            },
          ),
        );
      } catch (error) {
        this.logger.error(`Failed to delete file: ${error.message}`);
        throw new RpcException({
          code: 500,
          message: '删除文件失败',
          data: error,
        });
      }

      // 使用乐观锁删除诊断记录
      const deleteResult = await queryRunner.manager.delete(DiagnosisHistory, {
        id,
        version: diagnosis.version,
      });

      if (deleteResult.affected === 0) {
        throw new RpcException({
          code: 409,
          message: '诊断记录已被其他操作修改，请重试',
        });
      }

      await queryRunner.commitTransaction();

      // 清除相关缓存
      await this.clearRelatedCache(userId, id);

      return formatResponse(204, null, '删除诊断记录成功');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        code: 500,
        message: '删除诊断记录失败',
        data: error,
      });
    } finally {
      await queryRunner.release();
    }
  }

  // 批量删除诊断记录
  async diagnosisHistoriesDelete(userId: number, diagnosisIds: number[]) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 使用乐观锁获取诊断记录列表
      const diagnosisList = await queryRunner.manager.find(DiagnosisHistory, {
        where: { id: In(diagnosisIds), createdBy: userId },
        select: ['id', 'fileId', 'version'],
      });

      if (diagnosisList.length !== diagnosisIds.length) {
        this.logger.error(
          `Some diagnoses not found: ${diagnosisIds.join(',')}`,
        );
        throw new RpcException({
          code: 404,
          message: '未找到诊断记录',
        });
      }

      // 先删除文件
      try {
        await firstValueFrom(
          this.fileClient.send(
            { cmd: FILE_MESSAGE_PATTERNS.FILE_DELETE_BATCH },
            {
              fileIds: diagnosisList.map((diagnosis) => diagnosis.fileId),
              userId,
            },
          ),
        );
      } catch (error) {
        this.logger.error(`Failed to delete files: ${error.message}`);
        throw new RpcException({
          code: 500,
          message: '删除文件失败',
          data: error,
        });
      }

      // 使用乐观锁批量删除诊断记录
      const deletePromises = diagnosisList.map((diagnosis) =>
        queryRunner.manager.delete(DiagnosisHistory, {
          id: diagnosis.id,
          version: diagnosis.version,
        }),
      );

      const deleteResults = await Promise.all(deletePromises);
      const hasConflict = deleteResults.some((result) => result.affected === 0);

      if (hasConflict) {
        throw new RpcException({
          code: 409,
          message: '部分诊断记录已被其他操作修改，请重试',
        });
      }

      await queryRunner.commitTransaction();

      // 清除相关缓存
      await this.clearRelatedCache(userId);

      return formatResponse(204, null, '删除诊断记录成功');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof RpcException) {
        throw error;
      }
      throw new RpcException({
        code: 500,
        message: '删除诊断记录失败',
        data: error,
      });
    } finally {
      await queryRunner.release();
    }
  }

  // 获取诊断历史记录列表
  async diagnosisHistoryListGet(query: PageQueryDto, userId: number) {
    const { page, pageSize } = query;
    const cacheKey = this.generateCacheKey(
      'DIAGNOSIS_LIST',
      userId,
      page,
      pageSize,
    );

    const cachedResult = await this.redisService.get<{
      list: DiagnosisHistory[];
      total: number;
      page: number;
      pageSize: number;
    }>(cacheKey);

    if (cachedResult) {
      return formatResponse(200, cachedResult, '获取诊断历史记录成功（缓存）');
    }

    const [list, total] = await this.diagnosisRepository.findAndCount({
      where: { createdBy: userId },
      order: { createdAt: 'DESC' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    const result = { list, total, page, pageSize };

    // 缓存结果
    await this.redisService.set(cacheKey, result, this.CACHE_TTL);

    return formatResponse(200, result, '获取诊断历史记录成功');
  }
}
