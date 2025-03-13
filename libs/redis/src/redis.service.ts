import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid
import { ConfigEnum } from '@shared/enum/config.enum';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>(ConfigEnum.REDIS_HOST);
    const port = this.configService.get<number>(ConfigEnum.REDIS_PORT);
    this.client = new Redis({
      host,
      port,
      db: 0, // 目标数据库
    });
  }

  /**
   * 设置缓存，支持可选 TTL（单位：秒）
   * 数据将被 JSON 序列化存储，从而兼容任意类型
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 可选过期时间（秒）
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.client.set(key, serialized, 'EX', ttl);
    } else {
      await this.client.set(key, serialized);
    }
  }

  /**
   * 获取缓存内容
   * 通过反序列化还原原始数据
   * @param key 缓存键
   * @returns 返回缓存值或 null
   */
  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch (error) {
      // 如果反序列化失败，则原样返回数据
      return data as unknown as T;
    }
  }

  /**
   * 删除指定的缓存键
   * @param key 缓存键
   * @returns 返回被删除的键数量
   */
  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  /**
   * 对缓存中存储的数字进行自增操作
   * 利用 Redis 内置的 incrby 命令保证操作的原子性
   * @param key 缓存键
   * @param delta 增量，默认为 1
   * @returns 返回自增后的值
   */
  async increment(key: string, delta: number = 1): Promise<number> {
    return await this.client.incrby(key, delta);
  }

  /**
   * 尝试获取分布式锁
   * 采用 SET key value NX PX ttl 方式实现，内置重试机制确保尽可能获取锁
   * @param lockKey 锁的键
   * @param ttl 锁的有效期（毫秒）
   * @param retryDelay 每次重试间隔（毫秒），默认 100ms
   * @param maxRetries 最大重试次数，默认 10 次
   * @returns 成功则返回唯一 token，否则抛出异常
   */
  async acquireLock(
    lockKey: string,
    ttl: number,
    retryDelay = 100,
    maxRetries = 10,
  ): Promise<string> {
    const token = uuidv4();
    let retries = 0;
    while (retries < maxRetries) {
      const result = await this.client.set(lockKey, token, 'PX', ttl, 'NX');
      if (result === 'OK') {
        return token;
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      retries++;
    }
    throw new Error(`无法获取锁：${lockKey}`);
  }

  /**
   * 释放分布式锁
   * 利用 Lua 脚本确保只有持有正确 token 的客户端才能释放锁
   * @param lockKey 锁的键
   * @param token 锁的唯一 token
   * @returns 是否成功释放锁
   */
  async releaseLock(lockKey: string, token: string): Promise<boolean> {
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
   * 在获取锁后执行回调函数，确保操作的原子性和互斥性
   * @param lockKey 锁的键
   * @param ttl 锁的有效期（毫秒）
   * @param fn 回调函数，返回 Promise<T>
   * @param retryDelay 每次重试间隔（毫秒），默认 100ms
   * @param maxRetries 最大重试次数，默认 10 次
   * @returns 回调函数的返回结果
   */
  async executeWithLock<T>(
    lockKey: string,
    ttl: number,
    fn: () => Promise<T>,
    retryDelay = 100,
    maxRetries = 10,
  ): Promise<T> {
    const token = await this.acquireLock(lockKey, ttl, retryDelay, maxRetries);
    try {
      return await fn();
    } finally {
      await this.releaseLock(lockKey, token);
    }
  }

  /**
   * 模块销毁时自动关闭 Redis 连接，确保资源得以妥善释放
   */
  async onModuleDestroy() {
    await this.client.quit();
  }
}
