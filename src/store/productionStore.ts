/**
 * Production Store — Centralized cache & data layer for HourByHourView
 *
 * Features:
 * - In-memory cache with configurable TTL (60s active, 300s historical)
 * - Inflight request deduplication (same key → same Promise)
 * - Stale-while-revalidate (return cached data immediately, refresh in background)
 * - Selective cache invalidation per data type
 * - localStorage persistence for frequently-queried data (plans, operative records)
 */
import { create } from 'zustand';
import type { PlanRecord, HourRecord } from '../types';
import {
  getLogisticPlans,
  getHourRecords,
  getFaultRecords,
  getScrapRecords,
  getDowntimeRecords,
  getOperativeRecords,
} from '../api/productionService';

/* ── Cache Entry ── */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

/* ── TTL Constants ── */
const ACTIVE_TTL_MS = 60_000;   // 60 seconds for current-day data
const HISTORY_TTL_MS = 300_000; // 5 minutes for historical data

/* ── Inflight Deduplication Map ── */
const inflightRequests = new Map<string, Promise<any>>();
let cacheEpoch = 0;
const MAX_CACHE_ENTRIES = 32;
function boundedCache<T>(cache: Record<string, CacheEntry<T>>) {
  return Object.fromEntries(Object.entries(cache).sort((a,b)=>b[1].timestamp-a[1].timestamp).slice(0,MAX_CACHE_ENTRIES));
}

function deduplicatedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = inflightRequests.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fetcher().finally(() => {
    if(inflightRequests.get(key) === promise) inflightRequests.delete(key);
  });
  inflightRequests.set(key, promise);
  return promise;
}

/* ── Cache Key Builders ── */
function makeDateKey(prefix: string, startDate: string, endDate: string): string {
  const session = JSON.parse(localStorage.getItem('gulliver_auth_session') || 'null');
  return [session?.id || 'anonymous', session?.role || '', prefix, startDate, endDate].join(':');
}

/* ── Check if a date range is "today" ── */
function isCurrentDay(startDate: string): boolean {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return startDate === todayStr;
}

function getTTL(startDate: string): number {
  return isCurrentDay(startDate) ? ACTIVE_TTL_MS : HISTORY_TTL_MS;
}

function isFresh<T>(entry: CacheEntry<T> | undefined, ttl: number): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < ttl;
}

/* ── Store Types ── */
type CacheType = 'plans' | 'hours' | 'faults' | 'scrap' | 'downtime' | 'operative';

interface ProductionState {
  /* ── Cache Maps ── */
  plansCache: Record<string, CacheEntry<PlanRecord[]>>;
  hourRecordsCache: Record<string, CacheEntry<HourRecord[]>>;
  faultsCache: Record<string, CacheEntry<any[]>>;
  scrapCache: Record<string, CacheEntry<any[]>>;
  downtimeCache: Record<string, CacheEntry<any[]>>;
  operativeCache: Record<string, CacheEntry<any[]>>;

  /* ── Fetchers (cache-aware, deduplication-aware, SWR-aware) ── */
  fetchPlans: (startDate: string, endDate: string, opts?: { force?: boolean }) => Promise<PlanRecord[]>;
  fetchHourRecords: (startDate: string, endDate: string, opts?: { force?: boolean }) => Promise<HourRecord[]>;
  fetchFaults: (startDate: string, endDate: string, opts?: { force?: boolean }) => Promise<any[]>;
  fetchScrap: (startDate: string, endDate: string, opts?: { force?: boolean }) => Promise<any[]>;
  fetchDowntime: (startDate: string, endDate: string, opts?: { force?: boolean }) => Promise<any[]>;
  fetchOperative: (startDate: string, endDate: string, opts?: { force?: boolean }) => Promise<any[]>;

  /* ── Parallel fetch all data for a date range ── */
  fetchAllForDateRange: (startDate: string, endDate: string, opts?: { force?: boolean }) => Promise<{
    plans: PlanRecord[];
    hourRecords: HourRecord[];
    faults: any[];
    scrap: any[];
    downtime: any[];
    operative: any[];
  }>;

  /* ── Cache Invalidation ── */
  invalidateCache: (type: CacheType | 'all') => void;
  invalidateByDateRange: (startDate: string, endDate: string) => void;

  /* ── Cache Stats (for debugging) ── */
  getCacheStats: () => { entries: number; inflight: number };
}

/* ── Create the Store ── */
export const useProductionStore = create<ProductionState>()(
    (set, get) => {
      /* ── Generic cache-aware fetcher with SWR ── */
      function createCacheFetcher<T>(
        cacheField: keyof Pick<ProductionState, 'plansCache' | 'hourRecordsCache' | 'faultsCache' | 'scrapCache' | 'downtimeCache' | 'operativeCache'>,
        prefix: string,
        apiFn: (startDate: string, endDate: string) => Promise<T[]>,
      ) {
        return async (startDate: string, endDate: string, opts?: { force?: boolean }): Promise<T[]> => {
          const epoch = cacheEpoch;
          const key = makeDateKey(prefix, startDate, endDate);
          const ttl = getTTL(startDate);
          const state = get();
          const cache = state[cacheField] as Record<string, CacheEntry<T[]>>;
          const entry = cache[key];

          // 1) Cache HIT — fresh data: return immediately
          if (!opts?.force && isFresh(entry, ttl)) {
            return entry!.data;
          }

          // 2) Cache STALE — return stale data immediately + background refresh (SWR)
          if (!opts?.force && entry) {
            // Fire background refresh (no await — fire-and-forget)
            deduplicatedFetch(key, () => apiFn(startDate, endDate)).then((freshData) => {
              if(epoch !== cacheEpoch) return;
              set((s) => ({
                [cacheField]: boundedCache({
                  ...(s[cacheField] as Record<string, CacheEntry<T[]>>),
                  [key]: { data: freshData, timestamp: Date.now(), key },
                }),
              }));
            }).catch((err) => {
              console.warn(`[ProductionStore] Background refresh failed for ${key}:`, err);
            });
            return entry.data;
          }

          // 3) Cache MISS — fetch and wait
          const data = await deduplicatedFetch(key, () => apiFn(startDate, endDate));
          if(epoch !== cacheEpoch) return data;
          set((s) => ({
            [cacheField]: boundedCache({
              ...(s[cacheField] as Record<string, CacheEntry<T[]>>),
              [key]: { data, timestamp: Date.now(), key },
            }),
          }));
          return data;
        };
      }

      return {
        /* ── Initial Cache State ── */
        plansCache: {},
        hourRecordsCache: {},
        faultsCache: {},
        scrapCache: {},
        downtimeCache: {},
        operativeCache: {},

        /* ── Cache-aware Fetchers ── */
        fetchPlans: createCacheFetcher<PlanRecord>('plansCache', 'plans', getLogisticPlans),
        fetchHourRecords: createCacheFetcher<HourRecord>('hourRecordsCache', 'hours', getHourRecords),
        fetchFaults: createCacheFetcher<any>('faultsCache', 'faults', getFaultRecords),
        fetchScrap: createCacheFetcher<any>('scrapCache', 'scrap', getScrapRecords),
        fetchDowntime: createCacheFetcher<any>('downtimeCache', 'downtime', getDowntimeRecords),
        fetchOperative: createCacheFetcher<any>('operativeCache', 'operative', getOperativeRecords),

        /* ── Parallel Fetch All ── */
        fetchAllForDateRange: async (startDate, endDate, opts) => {
          const state = get();
          const [plans, hourRecords, faults, scrap, downtime, operative] = await Promise.all([
            state.fetchPlans(startDate, endDate, opts),
            state.fetchHourRecords(startDate, endDate, opts),
            state.fetchFaults(startDate, endDate, opts),
            state.fetchScrap(startDate, endDate, opts),
            state.fetchDowntime(startDate, endDate, opts),
            state.fetchOperative(startDate, endDate, opts),
          ]);
          return { plans, hourRecords, faults, scrap, downtime, operative };
        },

        /* ── Cache Invalidation ── */
        invalidateCache: (type) => {
          cacheEpoch++; inflightRequests.clear();
          if (type === 'all') {
            set({
              plansCache: {},
              hourRecordsCache: {},
              faultsCache: {},
              scrapCache: {},
              downtimeCache: {},
              operativeCache: {},
            });
            return;
          }
          const fieldMap: Record<CacheType, keyof ProductionState> = {
            plans: 'plansCache',
            hours: 'hourRecordsCache',
            faults: 'faultsCache',
            scrap: 'scrapCache',
            downtime: 'downtimeCache',
            operative: 'operativeCache',
          };
          set({ [fieldMap[type]]: {} });
        },

        invalidateByDateRange: (startDate, endDate) => {
          cacheEpoch++; inflightRequests.clear();
          set((s) => {
            const cleanCache = <T>(cache: Record<string, CacheEntry<T>>): Record<string, CacheEntry<T>> => {
              const cleaned: Record<string, CacheEntry<T>> = {};
              for (const [k, v] of Object.entries(cache)) {
                const [cachedStart,cachedEnd] = k.split(':').slice(-2);
                if (cachedEnd < startDate || cachedStart > endDate) cleaned[k] = v;
              }
              return cleaned;
            };
            return {
              plansCache: cleanCache(s.plansCache),
              hourRecordsCache: cleanCache(s.hourRecordsCache),
              faultsCache: cleanCache(s.faultsCache),
              scrapCache: cleanCache(s.scrapCache),
              downtimeCache: cleanCache(s.downtimeCache),
              operativeCache: cleanCache(s.operativeCache),
            };
          });
        },

        /* ── Debug Stats ── */
        getCacheStats: () => {
          const s = get();
          const entries =
            Object.keys(s.plansCache).length +
            Object.keys(s.hourRecordsCache).length +
            Object.keys(s.faultsCache).length +
            Object.keys(s.scrapCache).length +
            Object.keys(s.downtimeCache).length +
            Object.keys(s.operativeCache).length;
          return { entries, inflight: inflightRequests.size };
        },
      };
    }
);
