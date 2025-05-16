import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
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

// Stream 相关类型定义
type StreamEntry<T> = {
  id: string;
  data: T;
};

type StreamReadOptions = {
  count?: number;
  block?: number;
  group?: string;
  consumer?: string;
  minId?: string;
  maxId?: string;
  noack?: boolean;
};

type StreamGroupInfo = {
  name: string;
  consumers: number;
  pending: number;
  lastDeliveredId: string;
};

type StreamInfo = {
  length: number;
  radixTreeNodes: number;
  radixTreeKeys: number;
  groups: number;
  lastGeneratedId: string;
  firstEntry?: StreamEntry<any>;
  lastEntry?: StreamEntry<any>;
};

/**
 * 统一的 Stream 操作选项
 */
type StreamOptions = RedisRetryOptions & {
  count?: number;
  block?: number;
  noack?: boolean;
  mkstream?: boolean;
  entriesRead?: number;
  approximately?: boolean;
  equal?: boolean;
  limit?: number;
};

/**
 * 统一的 Stream 操作结果
 */
type StreamResult<T> = {
  id: string;
  data: T;
};

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
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
   * 获取 Redis 客户端实例
   * @returns Redis 客户端实例
   */
  getClient(): Redis {
    return this.client;
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
      const parsed = JSON.parse(data);
      // 验证解析后的数据是否包含必要的字段
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as T;
      }
      return null;
    } catch (error) {
      console.error('Redis 数据反序列化失败:', error);
      return null;
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

  /**
   * 统一的错误处理和重试逻辑
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    options: StreamOptions = {},
  ): Promise<T> {
    const { retries = 3, retryDelay = 100 } = options;
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (i < retries - 1) {
          const delay = Math.min(
            retryDelay * Math.pow(2, i) + Math.random() * 100,
            1000,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          console.warn('Stream 操作失败，准备重试:', {
            attempt: i + 1,
            error: error.message,
            delay,
          });
        }
      }
    }

    throw new Error(
      `Stream 操作失败，已重试 ${retries} 次: ${lastError?.message}`,
    );
  }

  /**
   * 统一的 Stream 消息序列化
   */
  private serializeStreamData<T>(data: T): string {
    return JSON.stringify(data);
  }

  /**
   * 统一的 Stream 消息反序列化
   */
  private deserializeStreamData<T>(data: string): T {
    try {
      return JSON.parse(data) as T;
    } catch (error) {
      console.error('Stream 消息反序列化失败:', error);
      throw error;
    }
  }

  /**
   * 向 Stream 添加消息
   */
  async xadd<T extends RedisValue>(
    key: RedisKey,
    data: T,
    options: StreamOptions = {},
  ): Promise<string> {
    return this.withRetry(async () => {
      const serialized = this.serializeStreamData(data);
      const id = await this.client.xadd(key, '*', 'data', serialized);
      if (!id) throw new Error('消息ID为空');
      return id;
    }, options);
  }

  /**
   * 从 Stream 读取消息
   */
  async xread<T extends RedisValue>(
    key: RedisKey,
    options: StreamOptions = {},
  ): Promise<StreamResult<T>[]> {
    const { count = 10, block = 0 } = options;
    const args: ['STREAMS', string, ...(string | number)[]] = ['STREAMS', key];

    if (block > 0) args.push('BLOCK', block);
    if (count > 0) args.push('COUNT', count);
    args.push('$');

    return this.withRetry(async () => {
      const result = await this.client.xread(...args);
      if (!result) return [];

      return result[0][1].map((entry: [string, string[]]) => {
        const fields = entry[1];
        const dataIndex = fields.indexOf('data');
        if (dataIndex === -1) {
          throw new Error('Stream 消息中缺少 data 字段');
        }
        return {
          id: entry[0],
          data: this.deserializeStreamData<T>(fields[dataIndex + 1]),
        };
      });
    }, options);
  }

  /**
   * 创建消费者组
   */
  async xgroupCreate(
    key: RedisKey,
    group: string | Buffer,
    startId: string | Buffer | number = '0',
    options: StreamOptions = {},
  ): Promise<void> {
    if (!key || !group) {
      throw new Error('Stream 键和消费者组名称不能为空');
    }

    return this.withRetry(async () => {
      await (this.client.xgroup as any)(
        'CREATE',
        key,
        group,
        startId.toString(),
        ...(options.mkstream ? ['MKSTREAM'] : []),
        ...(options.entriesRead !== undefined
          ? ['ENTRIESREAD', options.entriesRead.toString()]
          : []),
      );
    }, options);
  }

  /**
   * 从消费者组读取消息
   */
  async xreadgroup<T extends RedisValue>(
    key: RedisKey,
    group: string | Buffer,
    consumer: string | Buffer,
    options: StreamOptions = {},
  ): Promise<StreamResult<T>[]> {
    if (!key || !group || !consumer) {
      throw new Error('Stream 键、消费者组名称和消费者名称不能为空');
    }

    const { count = 10, block = 0, noack = false } = options;

    return this.withRetry(async () => {
      const result = await (this.client.xreadgroup as any)(
        'GROUP',
        group,
        consumer,
        ...(noack ? ['NOACK'] : []),
        ...(block > 0 ? ['BLOCK', block] : []),
        ...(count > 0 ? ['COUNT', count] : []),
        'STREAMS',
        key,
        '>',
      );

      if (!result || !Array.isArray(result) || result.length === 0) {
        return [];
      }

      const streamResult = result[0] as [
        string,
        Array<[string, [string, string]]>,
      ];
      if (!Array.isArray(streamResult[1])) {
        throw new Error('返回数据格式错误');
      }

      return streamResult[1]
        .map((entry) => ({
          id: entry[0],
          data: this.deserializeStreamData<T>(entry[1][1]),
        }))
        .filter((entry): entry is StreamResult<T> => entry !== null);
    }, options);
  }

  /**
   * 确认消息已处理
   */
  async xack(
    key: RedisKey,
    group: string | Buffer,
    messageIds: (string | Buffer | number)[],
    options: StreamOptions = {},
  ): Promise<number> {
    if (!key || !group) {
      throw new Error('Stream 键和消费者组名称不能为空');
    }

    if (!messageIds || messageIds.length === 0) {
      console.warn('没有提供消息ID:', { key, group });
      return 0;
    }

    return this.withRetry(async () => {
      const acknowledgedCount = await this.client.xack(
        key,
        group,
        ...messageIds,
      );

      if (acknowledgedCount === 0) {
        console.warn('没有消息被确认:', { key, group, messageIds });
      } else if (acknowledgedCount < messageIds.length) {
        console.warn('部分消息确认失败:', {
          key,
          group,
          total: messageIds.length,
          acknowledged: acknowledgedCount,
        });
      }

      return acknowledgedCount;
    }, options);
  }

  /**
   * 获取 Stream 信息
   * @param key Stream 键
   * @returns Stream 信息
   */
  async xinfo(key: RedisKey): Promise<StreamInfo | null> {
    try {
      const info = await this.client.xinfo('STREAM', key);
      if (!info || !Array.isArray(info)) return null;

      const result: StreamInfo = {
        length: 0,
        radixTreeNodes: 0,
        radixTreeKeys: 0,
        groups: 0,
        lastGeneratedId: '0-0',
      };

      // 解析 Stream 信息
      for (let i = 0; i < info.length; i += 2) {
        const field = info[i];
        const value = info[i + 1];

        switch (field) {
          case 'length':
            result.length = parseInt(value as string, 10);
            break;
          case 'radix-tree-nodes':
            result.radixTreeNodes = parseInt(value as string, 10);
            break;
          case 'radix-tree-keys':
            result.radixTreeKeys = parseInt(value as string, 10);
            break;
          case 'groups':
            result.groups = parseInt(value as string, 10);
            break;
          case 'last-generated-id':
            result.lastGeneratedId = value as string;
            break;
          case 'first-entry':
            if (value && Array.isArray(value)) {
              result.firstEntry = {
                id: value[0] as string,
                data: JSON.parse(value[1][1]),
              };
            }
            break;
          case 'last-entry':
            if (value && Array.isArray(value)) {
              result.lastEntry = {
                id: value[0] as string,
                data: JSON.parse(value[1][1]),
              };
            }
            break;
        }
      }

      return result;
    } catch (error) {
      if (error.message.includes('no such key')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * 获取消费者组信息
   * @param key Stream 键
   * @param group 消费者组名称
   * @param options 重试选项
   * @returns 消费者组信息
   */
  async xinfoGroup(
    key: RedisKey,
    group: string,
    options: RedisRetryOptions = { retries: 3 },
  ): Promise<StreamGroupInfo> {
    if (!key || !group) {
      throw new Error('Stream 键和消费者组名称不能为空');
    }

    let lastError: Error | null = null;
    const maxRetries = options.retries ?? 3;
    const retryDelay = options.retryDelay ?? 100;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const info = await this.client.xinfo('GROUPS', key);
        if (!info || !Array.isArray(info)) {
          throw new Error('获取消费者组信息失败：返回数据格式错误');
        }

        const groupInfo = info.find((g) => g[1] === group);
        if (!groupInfo) {
          throw new Error(`消费者组 ${group} 不存在`);
        }

        // 验证返回数据的完整性
        if (groupInfo.length < 8) {
          throw new Error('消费者组信息不完整');
        }

        const result: StreamGroupInfo = {
          name: groupInfo[1] as string,
          consumers: parseInt(groupInfo[3] as string, 10),
          pending: parseInt(groupInfo[5] as string, 10),
          lastDeliveredId: groupInfo[7] as string,
        };

        // 验证数值字段
        if (isNaN(result.consumers) || isNaN(result.pending)) {
          throw new Error('消费者组信息中的数值字段格式错误');
        }

        return result;
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          const delay = Math.min(
            retryDelay * Math.pow(2, i) + Math.random() * 100,
            1000,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          console.warn('获取消费者组信息失败，准备重试:', {
            key,
            group,
            attempt: i + 1,
            error: error.message,
            delay,
          });
        }
      }
    }

    throw new Error(
      `获取消费者组信息失败，已重试 ${maxRetries} 次: ${lastError?.message}`,
    );
  }

  /**
   * 获取待处理消息
   * @param key Stream 键
   * @param group 消费者组名称
   * @param consumer 消费者名称
   * @param options 读取选项
   * @returns 待处理消息数组
   */
  async xpending<T extends RedisValue>(
    key: RedisKey,
    group: string,
    consumer?: string,
    options: StreamReadOptions = {},
  ): Promise<StreamEntry<T>[]> {
    const { count = 10 } = options;

    try {
      let result;
      if (consumer) {
        result = await this.client.xpending(
          key,
          group,
          '-',
          '+',
          count.toString(),
          consumer,
        );
      } else {
        result = await this.client.xpending(
          key,
          group,
          '-',
          '+',
          count.toString(),
        );
      }

      if (!result || result.length === 0) return [];

      // 获取待处理消息的详细信息
      const messageIds = result.map(
        (entry: [string, string, number, string]) => entry[0],
      );
      const messages = await this.client.xrange(
        key,
        messageIds[0],
        messageIds[messageIds.length - 1],
      );

      return messages.map((entry: [string, [string, string]]) => ({
        id: entry[0],
        data: JSON.parse(entry[1][1]) as T,
      }));
    } catch (error) {
      if (error.message.includes('no such key')) {
        return [];
      }
      throw error;
    }
  }

  /**
   * 删除消息
   */
  async xdel(
    key: RedisKey,
    messageIds: (string | Buffer | number)[],
    options: StreamOptions = {},
  ): Promise<number> {
    if (!messageIds || messageIds.length === 0) {
      return 0;
    }

    return this.withRetry(async () => {
      const deletedCount = await this.client.xdel(key, ...messageIds);
      if (deletedCount === 0) {
        console.warn('没有消息被删除:', { key, messageIds });
      }
      return deletedCount;
    }, options);
  }

  /**
   * 创建 pipeline
   * @returns pipeline 实例
   */
  pipeline() {
    return this.client.pipeline();
  }

  /**
   * 获取 Stream 长度
   * @param key Stream 键
   * @returns Stream 长度
   */
  async xlen(key: RedisKey): Promise<number> {
    return await this.client.xlen(key);
  }
}
