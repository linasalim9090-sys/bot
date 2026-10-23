import { LRUCache } from 'lru-cache';

export type CooldownResult =
  | { allowed: true }
  | { allowed: false; retryAt: number };

export class CooldownService {
  private readonly cache = new LRUCache<string, number>({
    max: 5000,
  });

  check(key: string, ms: number, now = Date.now()): CooldownResult {
    const expiry = this.cache.get(key);
    if (expiry !== undefined && now < expiry) {
      return { allowed: false, retryAt: expiry };
    }

    this.cache.set(key, now + ms);
    return { allowed: true };
  }

  clear(key: string): void {
    this.cache.delete(key);
  }
}
