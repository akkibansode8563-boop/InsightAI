interface CacheEntry {
  value: any;
  expiry: number;
}

const localStore = new Map<string, CacheEntry>();

export interface ICacheManager {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Standard In-Memory TTL Cache Manager (Serverless friendly)
 */
export class MemoryCacheManager implements ICacheManager {
  async get<T>(key: string): Promise<T | null> {
    const entry = localStore.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      localStore.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    localStore.set(key, {
      value,
      expiry: Date.now() + (ttlSeconds * 1000)
    });
  }

  async del(key: string): Promise<void> {
    localStore.delete(key);
  }

  async clear(): Promise<void> {
    localStore.clear();
  }
}

/**
 * Redis Cache Manager (Enterprise Production ready)
 */
export class RedisCacheManager implements ICacheManager {
  private client: any = null;

  private async getClient() {
    if (this.client) return this.client;
    
    // Dynamic import to avoid missing Redis driver errors during local JSON execution
    try {
      const { createClient } = await import('redis');
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.client = createClient({ url: redisUrl });
      await this.client.connect();
      return this.client;
    } catch (e: any) {
      console.warn("RedisCacheManager: Could not connect to Redis, falling back to Memory Cache:", e.message);
      return null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const redis = await this.getClient();
    if (!redis) {
      // Fallback
      return memoryCache.get(key);
    }
    const val = await redis.get(key);
    return val ? JSON.parse(val) as T : null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const redis = await this.getClient();
    if (!redis) {
      // Fallback
      return memoryCache.set(key, value, ttlSeconds);
    }
    await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
  }

  async del(key: string): Promise<void> {
    const redis = await this.getClient();
    if (!redis) {
      return memoryCache.del(key);
    }
    await redis.del(key);
  }

  async clear(): Promise<void> {
    const redis = await this.getClient();
    if (!redis) {
      return memoryCache.clear();
    }
    await redis.flushAll();
  }
}

// Select active cache manager based on environment
const memoryCache = new MemoryCacheManager();
export const cacheManager: ICacheManager = process.env.REDIS_URL ? new RedisCacheManager() : memoryCache;
