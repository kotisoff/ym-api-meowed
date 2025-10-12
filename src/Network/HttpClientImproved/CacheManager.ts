import { LRUCache } from "lru-cache";

export class CacheManager {
  private cache: LRUCache<string, any>;
  private ttl: number;

  constructor(options?: { cacheTTL?: number; cacheMaxSize?: number }) {
    this.ttl = options?.cacheTTL ?? 300_000;
    this.cache = new LRUCache({
      max: options?.cacheMaxSize ?? 500,
      ttl: this.ttl,
      updateAgeOnGet: true
    });
  }

  get<T>(key: string): T | null {
    return this.cache.get(key) ?? null;
  }

  set<T>(key: string, value: T) {
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }
}
