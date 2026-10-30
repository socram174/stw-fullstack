import { parseLatestResponse } from "./alert-response.ts"
import type { LatestAlertsResponse } from "../types.ts"

const CACHE_KEY = "stw-alerts-latest"
const CACHE_VERSION = 1
const RESET_GRACE_MS = 60_000
const STALE_RETRY_MS = 5 * 60_000
const SANTIAGO_TIME_ZONE = "America/Santiago"

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

interface LatestAlertsCacheEntry {
  version: number
  cachedAt: number
  expiresAt: number
  response: LatestAlertsResponse
}

interface LoadLatestAlertsOptions {
  signal: AbortSignal
  request: (signal: AbortSignal) => Promise<unknown>
  force?: boolean
  storage?: StorageLike | null
  now?: number
}

function browserStorage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage
  } catch {
    return null
  }
}

function calendarDateAt(timestamp: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp))
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)?.value
  return `${part("year")}-${part("month")}-${part("day")}`
}

export function currentMissionRotationDate(now = Date.now()) {
  const date = new Date(now)
  const latestReset = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  )
  return calendarDateAt(latestReset, SANTIAGO_TIME_ZONE)
}

export function nextMissionResetAt(now = Date.now()) {
  const date = new Date(now)
  return (
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + 1
    ) + RESET_GRACE_MS
  )
}

function isCurrentRotation(response: LatestAlertsResponse, now: number) {
  return (
    response.rotation?.date === currentMissionRotationDate(now) &&
    response.rotation.afterReset
  )
}

export function readLatestAlertsCache(
  storage: StorageLike | null = browserStorage(),
  now = Date.now()
) {
  if (!storage) return null
  try {
    const raw = storage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw) as Partial<LatestAlertsCacheEntry>
    if (
      cached.version !== CACHE_VERSION ||
      typeof cached.cachedAt !== "number" ||
      typeof cached.expiresAt !== "number" ||
      cached.cachedAt > now ||
      cached.expiresAt <= now
    ) {
      storage.removeItem(CACHE_KEY)
      return null
    }
    const response = parseLatestResponse(cached.response)
    return { ...cached, response } as LatestAlertsCacheEntry
  } catch {
    try {
      storage.removeItem(CACHE_KEY)
    } catch {
      // Cache failures must never prevent alerts from loading.
    }
    return null
  }
}

export function writeLatestAlertsCache(
  response: LatestAlertsResponse,
  storage: StorageLike | null = browserStorage(),
  now = Date.now()
) {
  if (!storage) return
  const nextReset = nextMissionResetAt(now)
  const expiresAt = isCurrentRotation(response, now)
    ? nextReset
    : Math.min(now + STALE_RETRY_MS, nextReset)
  const entry: LatestAlertsCacheEntry = {
    version: CACHE_VERSION,
    cachedAt: now,
    expiresAt,
    response,
  }
  try {
    storage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    // localStorage can be unavailable or full; the network response still wins.
  }
}

export async function loadLatestAlerts({
  signal,
  request,
  force = false,
  storage = browserStorage(),
  now = Date.now(),
}: LoadLatestAlertsOptions) {
  if (!force) {
    const cached = readLatestAlertsCache(storage, now)
    if (cached) return cached.response
  }

  const response = parseLatestResponse(await request(signal))
  writeLatestAlertsCache(response, storage, now)
  return response
}

export const latestAlertsCacheConfig = {
  key: CACHE_KEY,
  version: CACHE_VERSION,
  resetGraceMs: RESET_GRACE_MS,
  staleRetryMs: STALE_RETRY_MS,
} as const
