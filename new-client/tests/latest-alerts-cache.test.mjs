import assert from "node:assert/strict"
import { test } from "node:test"
import {
  currentMissionRotationDate,
  latestAlertsCacheConfig,
  loadLatestAlerts,
  nextMissionResetAt,
  readLatestAlertsCache,
  writeLatestAlertsCache,
} from "../src/features/alerts/api/latest-alerts-cache.ts"

function storage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    raw: (key) => values.get(key) ?? null,
  }
}

function responseFor(now, overrides = {}) {
  return {
    data: [],
    rotation: {
      date: currentMissionRotationDate(now),
      afterReset: true,
    },
    summary: {
      totalVbucks: 0,
      missions: 0,
      zones: 0,
      minPower: null,
      days: 0,
    },
    ...overrides,
  }
}

const now = Date.UTC(2026, 9, 29, 12, 0, 0)

test("mission rotation follows the midnight UTC reset using Santiago calendar dates", () => {
  assert.equal(currentMissionRotationDate(now), "2026-10-28")
  assert.equal(
    nextMissionResetAt(now),
    Date.UTC(2026, 9, 30, 0, 1, 0)
  )
})

test("valid current-rotation cache avoids the backend", async () => {
  const local = storage()
  const expected = responseFor(now)
  writeLatestAlertsCache(expected, local, now)
  let requests = 0

  const result = await loadLatestAlerts({
    signal: new AbortController().signal,
    storage: local,
    now: now + 1_000,
    request: async () => {
      requests += 1
      return expected
    },
  })

  assert.deepEqual(result, expected)
  assert.equal(requests, 0)
})

test("force refresh bypasses a valid cache and replaces it", async () => {
  const local = storage()
  writeLatestAlertsCache(responseFor(now), local, now)
  const fresh = responseFor(now, {
    summary: { totalVbucks: 50, missions: 1, zones: 1, minPower: 15, days: 1 },
  })
  let requests = 0

  const result = await loadLatestAlerts({
    signal: new AbortController().signal,
    storage: local,
    now: now + 1_000,
    force: true,
    request: async () => {
      requests += 1
      return fresh
    },
  })

  assert.deepEqual(result, fresh)
  assert.equal(requests, 1)
  assert.deepEqual(readLatestAlertsCache(local, now + 2_000)?.response, fresh)
})

test("old cache versions and corrupt JSON are discarded", () => {
  for (const value of [
    "not-json",
    JSON.stringify({
      version: latestAlertsCacheConfig.version - 1,
      cachedAt: now,
      expiresAt: now + 60_000,
      response: responseFor(now),
    }),
  ]) {
    const local = storage({ [latestAlertsCacheConfig.key]: value })
    assert.equal(readLatestAlertsCache(local, now), null)
    assert.equal(local.raw(latestAlertsCacheConfig.key), null)
  }
})

test("cache expires after the next reset grace window", () => {
  const local = storage()
  writeLatestAlertsCache(responseFor(now), local, now)
  const reset = nextMissionResetAt(now)

  assert.ok(readLatestAlertsCache(local, reset - 1))
  assert.equal(readLatestAlertsCache(local, reset), null)
})

test("a stale backend rotation is only cached briefly", () => {
  const local = storage()
  const stale = responseFor(now, {
    rotation: { date: "2026-10-27", afterReset: true },
  })
  writeLatestAlertsCache(stale, local, now)

  assert.ok(
    readLatestAlertsCache(local, now + latestAlertsCacheConfig.staleRetryMs - 1)
  )
  assert.equal(
    readLatestAlertsCache(local, now + latestAlertsCacheConfig.staleRetryMs),
    null
  )
})

test("storage failures never prevent a network response", async () => {
  const broken = {
    getItem: () => {
      throw new Error("blocked")
    },
    setItem: () => {
      throw new Error("blocked")
    },
    removeItem: () => {
      throw new Error("blocked")
    },
  }
  const expected = responseFor(now)

  const result = await loadLatestAlerts({
    signal: new AbortController().signal,
    storage: broken,
    now,
    request: async () => expected,
  })

  assert.deepEqual(result, expected)
})
