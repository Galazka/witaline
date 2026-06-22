type CacheEntry<T> = { value: T; expiresAt: number };

const store = new Map<string, CacheEntry<unknown>>();
const pendingPromises = new Map<string, Promise<unknown>>();

const DEFAULT_TTL_MS = 10_000;

export function getCached<T>(key: string): T | undefined {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function setCache<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  if (store.size > 1000) {
    const now = Date.now();
    for (const [k, v] of store) {
      if (now > v.expiresAt) store.delete(k);
    }
  }
}

export function invalidateCache(key: string): void {
  store.delete(key);
}

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS
): Promise<T> {
  const cached = getCached<T>(key);
  if (cached !== undefined) return cached;

  const pending = pendingPromises.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const promise = fetcher().then((result) => {
    setCache(key, result, ttlMs);
    pendingPromises.delete(key);
    return result;
  }).catch((err) => {
    pendingPromises.delete(key);
    throw err;
  });

  pendingPromises.set(key, promise);
  return promise;
}
