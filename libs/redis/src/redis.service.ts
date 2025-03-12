import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * 设置缓存，支持可选 TTL 时间（单位：秒）
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 可选过期时间
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  /**
   * 获取缓存内容
   * @param key 缓存键
   * @returns 缓存值或 null
   */
  async get<T>(key: string): Promise<T | null> {
    return await this.cacheManager.get<T>(key);
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * 增加缓存中数字值
   * @param key 缓存键
   * @param delta 增加值
   */
  async increment(key: string, delta: number = 1): Promise<void> {
    const current = (await this.get<number>(key)) || 0;
    await this.set(key, current + delta);
  }
}
