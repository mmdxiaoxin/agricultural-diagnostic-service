import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async set(key: string, value: string, ttl?: number) {
    if (ttl) {
      await this.redisClient.set(key, value, 'EX', ttl);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  async del(key: string) {
    await this.redisClient.del(key);
  }

  async hset(hash: string, key: string, value: string) {
    await this.redisClient.hset(hash, key, value);
  }

  async hget(hash: string, key: string): Promise<string | null> {
    return await this.redisClient.hget(hash, key);
  }

  async pipelineSet(keys: string[], values: string[]) {
    const pipeline = this.redisClient.pipeline();
    keys.forEach((key, index) => {
      pipeline.set(key, values[index]);
    });
    await pipeline.exec();
  }

  async quit() {
    await this.redisClient.quit();
  }
}
