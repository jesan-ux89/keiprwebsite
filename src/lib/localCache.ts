/**
 * localCache.ts — Per-user localStorage cache for instant hydration
 *
 * Mirrors mobile's AsyncStorage pattern: hydrate from cache on cold start,
 * revalidate in background, persist after successful API fetches.
 *
 * Key scheme: keipr.cache.{uid}.{dataType}
 * Each entry: { v: number, uid: string, data: T, cachedAt: number }
 *
 * Safety features:
 * - Schema versioning: bump CACHE_VERSIONS.{key} when data shape changes
 * - UID mismatch protection: entry.uid checked against current user
 * - Soft TTLs: stale entries treated as cache miss even if parseable
 * - QuotaExceededError handling: clear all cache on overflow
 * - Corrupt JSON: try/catch, auto-delete bad entries
 */

// ── Schema versions — bump when the cached data shape changes ──
// Stale versions auto-discard on read (no migration needed).
export const CACHE_VERSIONS: Record<string, number> = {
  available: 1,
  bills: 1,
  income: 1,
  accounts: 1,
  transactions: 1,
  budgetSummary: 1,
  payments: 1,
  confirmations: 1,
  categories: 1,
};

// ── Soft TTLs (milliseconds) — max display age before treating as miss ──
// Even with immediate revalidation, prevents "opened a 6-month-old tab" weirdness.
const CACHE_TTLS: Record<string, number> = {
  available:      60 * 60 * 1000,         // 1 hour
  bills:          7 * 24 * 60 * 60 * 1000, // 7 days
  income:         7 * 24 * 60 * 60 * 1000, // 7 days
  accounts:       24 * 60 * 60 * 1000,     // 24 hours (Plaid balance itself is 24h cached)
  transactions:   24 * 60 * 60 * 1000,     // 24 hours
  budgetSummary:  60 * 60 * 1000,          // 1 hour
  payments:       7 * 24 * 60 * 60 * 1000, // 7 days
  confirmations:  30 * 60 * 1000,          // 30 minutes
  categories:     30 * 24 * 60 * 60 * 1000, // 30 days (rarely changes)
};

// ── Invalidation groups ──
// Maps group names to cache keys that should be cleared together.
const INVALIDATION_GROUPS: Record<string, string[]> = {
  budget:       ['bills', 'income', 'budgetSummary', 'categories'],
  tracker:      ['payments'],
  available:    ['available'],
  banking:      ['accounts', 'transactions'],
  transactions: ['transactions'],
  review:       ['confirmations'],
};

// All valid invalidation group names
export type InvalidationGroup = keyof typeof INVALIDATION_GROUPS;

interface CacheEntry<T> {
  v: number;
  uid: string;
  data: T;
  cachedAt: number;
}

function cacheKey(uid: string, dataType: string): string {
  return `keipr.cache.${uid}.${dataType}`;
}

/**
 * Read a cached value. Returns null on miss, version mismatch, uid mismatch,
 * TTL expiry, or parse error.
 */
export function cacheGet<T>(uid: string, dataType: string): T | null {
  try {
    const raw = localStorage.getItem(cacheKey(uid, dataType));
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);

    // Version mismatch — schema changed, discard
    if (entry.v !== (CACHE_VERSIONS[dataType] ?? 1)) {
      localStorage.removeItem(cacheKey(uid, dataType));
      return null;
    }

    // UID mismatch — extra safety guard
    if (entry.uid !== uid) {
      localStorage.removeItem(cacheKey(uid, dataType));
      return null;
    }

    // Soft TTL expired
    const ttl = CACHE_TTLS[dataType] ?? 24 * 60 * 60 * 1000;
    if (Date.now() - entry.cachedAt > ttl) {
      localStorage.removeItem(cacheKey(uid, dataType));
      return null;
    }

    return entry.data;
  } catch {
    // Corrupt JSON — delete and miss
    try { localStorage.removeItem(cacheKey(uid, dataType)); } catch {}
    return null;
  }
}

/**
 * Persist a value to cache. Silently handles QuotaExceededError by clearing
 * all keipr cache keys and retrying once.
 */
export function cacheSet<T>(uid: string, dataType: string, data: T): void {
  const entry: CacheEntry<T> = {
    v: CACHE_VERSIONS[dataType] ?? 1,
    uid,
    data,
    cachedAt: Date.now(),
  };

  try {
    localStorage.setItem(cacheKey(uid, dataType), JSON.stringify(entry));
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      // Clear all keipr cache keys and retry once
      cacheClearAll();
      try {
        localStorage.setItem(cacheKey(uid, dataType), JSON.stringify(entry));
      } catch {
        // Give up silently — cache is a nice-to-have
      }
    }
  }
}

/**
 * Clear specific invalidation groups for a user.
 * Called AFTER successful mutations (not before).
 */
export function cacheInvalidateGroups(uid: string, groups: InvalidationGroup[]): void {
  const keysToRemove = new Set<string>();
  for (const group of groups) {
    const keys = INVALIDATION_GROUPS[group];
    if (keys) {
      for (const k of keys) keysToRemove.add(k);
    }
  }
  Array.from(keysToRemove).forEach(dataType => {
    try { localStorage.removeItem(cacheKey(uid, dataType)); } catch {}
  });
}

/**
 * Clear ALL cache for a specific user. Called on logout.
 */
export function cacheClear(uid: string): void {
  const allKeys = Object.keys(CACHE_VERSIONS);
  for (const dataType of allKeys) {
    try { localStorage.removeItem(cacheKey(uid, dataType)); } catch {}
  }
}

/**
 * Nuclear option: clear ALL keipr cache keys for ALL users.
 * Used as fallback when QuotaExceededError hits.
 */
export function cacheClearAll(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('keipr.cache.')) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch {}
}

/**
 * Cache metadata state shape for AppContext.
 * Helps debug "why did I see old data?" and prevents duplicate fetch storms.
 */
export interface CacheMeta {
  hydratedFromCache: boolean;
  lastHydratedAt: number | null;
  lastRefreshedAt: number | null;
  refreshInProgress: boolean;
}

export const INITIAL_CACHE_META: CacheMeta = {
  hydratedFromCache: false,
  lastHydratedAt: null,
  lastRefreshedAt: null,
  refreshInProgress: false,
};
