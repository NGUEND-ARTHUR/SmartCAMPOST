type CacheEntry<T> = { value: T; expiresAt: number };

export class DataOptimizationAgent {
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  constructor(private readonly ttlMs: number = 60_000) {}

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs?: number) {
    this.cache.set(key, { value, expiresAt: Date.now() + (ttlMs ?? this.ttlMs) });
  }

  clear(prefix?: string) {
    if (!prefix) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) this.cache.delete(key);
    }
  }
}
