import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigEnum } from '@shared/enum/config.enum';
import Redis, { ChainableCommander, RedisOptions } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

type RedisValue = string | number | boolean | null | object | any[];
type RedisKey = string;
type RedisTTL = number;
type RedisRetryOptions = {
  retries?: number;
  retryDelay?: number;
  maxWaitTime?: number;
  maxRetries?: number;
};

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>(ConfigEnum.REDIS_HOST);
    const port = this.configService.get<number>(ConfigEnum.REDIS_PORT);
    const password = this.configService.get<string>(ConfigEnum.REDIS_PASSWORD);
    const db = this.configService.get<number>(ConfigEnum.REDIS_DB);

    const redisOptions: RedisOptions = {
      host,
      port,
      db,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 10000,
      keepAlive: 30000,
    };

    // 只有在配置了密码时才添加密码选项
    if (password) {
      redisOptions.password = password;
    }

    this.client = new Redis(redisOptions);

    this.client.on('error', (error: Error) => {
      console.error('Redis 连接错误:', error);
    });

    this.client.on('connect', () => {
      console.log('Redis 连接成功');
    });
  }

  /**
   * 设置缓存，支持可选 TTL（单位：秒）
   * 数据将被 JSON 序列化存储，从而兼容任意类型
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 可选过期时间（秒）
   * @param options 重试选项
   */
  async set<T extends RedisValue>(
    key: RedisKey,
    value: T,
    ttl?: RedisTTL,
    options: RedisRetryOptions = { retries: 3 },
  ): Promise<void> {
    const serialized = JSON.stringify(value);
    let lastError: Error | null = null;

    for (let i = 0; i < (options.retries ?? 3); i++) {
      try {
        if (ttl) {
          await this.client.set(key, serialized, 'EX', ttl);
        } else {
          await this.client.set(key, serialized);
        }
        return;
      } catch (error) {
        lastError = error as Error;
        if (i < (options.retries ?? 3) - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, i) * 100),
          );
        }
      }
    }

    throw new Error(`Redis set 操作失败: ${lastError?.message}`);
  }

  /**
   * 获取缓存内容
   * 通过反序列化还原原始数据
   * @param key 缓存键
   * @returns 返回缓存值或 null
   */
  async get<T extends RedisValue>(key: RedisKey): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch (error) {
      return data as unknown as T;
    }
  }

  /**
   * 删除指定的缓存键
   * @param key 缓存键
   * @returns 返回被删除的键数量
   */
  async del(key: RedisKey): Promise<number> {
    return await this.client.del(key);
  }

  /**
   * 对缓存中存储的数字进行自增操作
   * @param key 缓存键
   * @param delta 增量，默认为 1
   * @returns 返回自增后的值
   */
  async increment(key: RedisKey, delta: number = 1): Promise<number> {
    return await this.client.incrby(key, delta);
  }

  /**
   * 存储用户会话信息
   * @param userId 用户ID
   * @param sessionId 会话ID
   * @param ttl 会话有效期，单位秒
   */
  async storeSession(
    userId: string,
    sessionId: string,
    ttl: RedisTTL,
  ): Promise<void> {
    await this.client.set(`session:${sessionId}`, userId, 'EX', ttl);
  }

  /**
   * 获取用户会话信息
   * @param sessionId 会话ID
   * @returns 返回用户ID或null
   */
  async getSession(sessionId: string): Promise<string | null> {
    return await this.client.get(`session:${sessionId}`);
  }

  /**
   * 删除用户会话
   * @param sessionId 会话ID
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.client.del(`session:${sessionId}`);
  }

  /**
   * 尝试获取分布式锁
   * @param lockKey 锁的键
   * @param ttl 锁的有效期（毫秒）
   * @param options 重试选项
   * @returns 成功则返回唯一 token，否则抛出异常
   */
  async acquireLock(
    lockKey: RedisKey,
    ttl: number,
    options: RedisRetryOptions = {
      retryDelay: 100,
      maxRetries: 10,
      maxWaitTime: 10000,
    },
  ): Promise<string> {
    const token = uuidv4();
    let retries = 0;
    let totalWaitTime = 0;

    while (
      retries < (options.maxRetries ?? 10) &&
      totalWaitTime < (options.maxWaitTime ?? 10000)
    ) {
      const result = await this.client.set(lockKey, token, 'PX', ttl, 'NX');
      if (result === 'OK') {
        return token;
      }

      const delay = Math.min(
        (options.retryDelay ?? 100) * Math.pow(2, retries) +
          Math.random() * 100,
        1000,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      totalWaitTime += delay;
      retries++;
    }

    throw new Error(`无法获取锁：${lockKey}`);
  }

  /**
   * 释放分布式锁
   * @param lockKey 锁的键
   * @param token 锁的唯一 token
   * @returns 是否成功释放锁
   */
  async releaseLock(lockKey: RedisKey, token: string): Promise<boolean> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then 
        return redis.call("del", KEYS[1]) 
      else 
        return 0 
      end
    `;
    const result = await this.client.eval(script, 1, lockKey, token);
    return result === 1;
  }

  /**
   * 包装带锁操作
   * @param lockKey 锁的键
   * @param ttl 锁的有效期（毫秒）
   * @param fn 回调函数
   * @param options 重试选项
   * @returns 回调函数的返回结果
   */
  async executeWithLock<T>(
    lockKey: RedisKey,
    ttl: number,
    fn: () => Promise<T>,
    options: RedisRetryOptions = {
      retryDelay: 100,
      maxRetries: 10,
    },
  ): Promise<T> {
    const token = await this.acquireLock(lockKey, ttl, options);
    try {
      return await fn();
    } finally {
      await this.releaseLock(lockKey, token);
    }
  }

  /**
   * 向列表右端添加元素
   * @param key 列表键
   * @param value 要添加的值
   */
  async rpush<T extends RedisValue>(key: RedisKey, value: T): Promise<number> {
    const serialized = JSON.stringify(value);
    return await this.client.rpush(key, serialized);
  }

  /**
   * 获取列表指定范围的元素
   * @param key 列表键
   * @param start 开始索引
   * @param end 结束索引
   */
  async lrange<T extends RedisValue>(
    key: RedisKey,
    start: number,
    end: number,
  ): Promise<T[]> {
    const data = await this.client.lrange(key, start, end);
    return data
      .map((item) => {
        try {
          return JSON.parse(item) as T;
        } catch (error) {
          console.error('反序列化数据失败:', error, '原始数据:', item);
          return null;
        }
      })
      .filter((item): item is T => item !== null);
  }

  /**
   * 批量获取列表元素
   * @param key 列表键
   * @param start 开始索引
   * @param end 结束索引
   * @param options 批量获取选项
   * @returns 解析后的数据数组
   */
  async lrangeBatch<T extends RedisValue>(
    key: RedisKey,
    start: number,
    end: number,
    options: {
      batchSize?: number;
      maxConcurrent?: number;
      retryOptions?: RedisRetryOptions;
    } = {},
  ): Promise<T[]> {
    const {
      batchSize = 100,
      maxConcurrent = 3,
      retryOptions = { retries: 3 },
    } = options;

    // 参数验证
    if (start < 0) {
      throw new Error('开始索引不能小于0');
    }
    if (end < start) {
      throw new Error('结束索引不能小于开始索引');
    }
    if (batchSize < 1) {
      throw new Error('批量大小必须大于0');
    }
    if (maxConcurrent < 1) {
      throw new Error('最大并发数必须大于0');
    }

    const result: T[] = [];
    const batches: { start: number; end: number }[] = [];
    let batchStart = start;
    let batchEnd = Math.min(batchStart + batchSize - 1, end);

    // 生成所有批次
    while (batchStart <= end) {
      batches.push({ start: batchStart, end: batchEnd });
      batchStart += batchSize;
      batchEnd = Math.min(batchStart + batchSize - 1, end);
    }

    // 并发处理批次
    for (let i = 0; i < batches.length; i += maxConcurrent) {
      const currentBatches = batches.slice(i, i + maxConcurrent);
      const batchPromises = currentBatches.map(async ({ start, end }) => {
        let lastError: Error | null = null;
        for (let retry = 0; retry < (retryOptions.retries ?? 3); retry++) {
          try {
            const data = await this.client.lrange(key, start, end);
            return data
              .map((item) => {
                try {
                  return JSON.parse(item) as T;
                } catch (error) {
                  console.error('反序列化数据失败:', error, '原始数据:', item);
                  return null;
                }
              })
              .filter((item): item is T => item !== null);
          } catch (error) {
            lastError = error as Error;
            if (retry < (retryOptions.retries ?? 3) - 1) {
              await new Promise((resolve) =>
                setTimeout(resolve, Math.pow(2, retry) * 100),
              );
            }
          }
        }
        throw new Error(`获取批次数据失败: ${lastError?.message}`);
      });

      const batchResults = await Promise.all(batchPromises);
      result.push(...batchResults.flat());
    }

    return result;
  }

  /**
   * 修剪列表，只保留指定范围内的元素
   * @param key 列表键
   * @param start 开始索引
   * @param end 结束索引
   */
  async ltrim(key: RedisKey, start: number, end: number): Promise<void> {
    await this.client.ltrim(key, start, end);
  }

  /**
   * 获取列表长度
   * @param key 列表键
   */
  async llen(key: RedisKey): Promise<number> {
    return await this.client.llen(key);
  }

  /**
   * 执行 Redis 事务
   * @returns ChainableCommander 实例
   */
  multi(): ChainableCommander {
    return this.client.multi();
  }

  /**
   * 执行 Redis 事务
   * @param commands 要执行的命令数组
   * @returns 执行结果
   */
  async execTransaction<T>(
    commands: ((multi: ChainableCommander) => void)[],
  ): Promise<T[]> {
    const multi = this.client.multi();

    commands.forEach((cmd) => cmd(multi));

    const results = await multi.exec();

    return (
      results?.map((result) => {
        if (result[0]) {
          throw new Error(`Redis 事务执行失败: ${result[0]}`);
        }
        return result[1] as T;
      }) || []
    );
  }

  /**
   * 模块销毁时自动关闭 Redis 连接
   */
  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  /**
   * redis 健康检查
   * @returns 是否健康
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      console.error('Redis 健康检查失败:', error);
      return false;
    }
  }
}
