import assert from "node:assert/strict"
import { test } from "node:test"
import {
  analyzeRewardDays,
  buildAnnualComparison,
} from "../src/features/history/lib/insights.ts"
import { parseZonesResponse } from "../src/features/alerts/api/alert-response.ts"

function day(date, vbucks) {
  return {
    date,
    endDate: date,
    vbucks,
    missions: vbucks > 0 ? 1 : 0,
    recordedDays: vbucks === null ? 0 : 1,
    totalDays: 1,
  }
}
function daily(from, to, data) {
  return { period: "all", interval: "day", from, to, data }
}

test("annual comparison aligns calendar months, preserves zeros and measures full calendar coverage", () => {
  const response = {
    period: "all",
    interval: "month",
    from: "2023-02-01",
    to: "2024-03-03",
    data: [
      {
        date: "2023-02-01",
        endDate: "2023-02-28",
        vbucks: 0,
        missions: 0,
        recordedDays: 28,
        totalDays: 28,
      },
      {
        date: "2023-03-01",
        endDate: "2023-03-31",
        vbucks: null,
        missions: 0,
        recordedDays: 0,
        totalDays: 31,
      },
      {
        date: "2024-02-01",
        endDate: "2024-02-29",
        vbucks: 100,
        missions: 2,
        recordedDays: 29,
        totalDays: 29,
      },
      {
        date: "2024-03-01",
        endDate: "2024-03-03",
        vbucks: 50,
        missions: 1,
        recordedDays: 3,
        totalDays: 3,
      },
    ],
  }
  const before = structuredClone(response)
  const comparison = buildAnnualComparison(response)
  assert.deepEqual(comparison.years, [2024, 2023])
  assert.equal(comparison.months.length, 12)
  assert.equal(comparison.months[1].values[2023].vbucks, 0)
  assert.equal(comparison.months[1].values[2023].partial, false)
  assert.equal(comparison.months[1].values[2024].calendarDays, 29)
  assert.equal(comparison.months[1].values[2024].partial, false)
  assert.equal(comparison.months[2].values[2024].partial, true)
  assert.equal(comparison.months[2].values[2024].calendarDays, 31)
  assert.equal(comparison.months[2].values[2023].vbucks, null)
  assert.equal(comparison.months[2].values[2023].inRange, true)
  assert.equal(comparison.months[11].values[2024].inRange, false)
  assert.deepEqual(response, before)
})

test("fully unrecorded years are not offered as comparison series", () => {
  const comparison = buildAnnualComparison({
    period: "all",
    interval: "month",
    from: "2025-01-01",
    to: "2026-01-01",
    data: [
      { ...day("2025-01-01", null), totalDays: 31, endDate: "2025-01-31" },
      day("2026-01-01", 0),
    ],
  })
  assert.deepEqual(comparison.years, [2026])
})

test("missing dates break streaks and never enter the zero-day denominator", () => {
  const response = daily("2026-01-01", "2026-01-08", [
    day("2026-01-07", 75),
    day("2026-01-01", 50),
    day("2026-01-02", 0),
    day("2026-01-03", 0),
    day("2026-01-04", null),
    day("2026-01-05", 0),
    day("2026-01-06", 50),
  ])
  const before = structuredClone(response)
  const stats = analyzeRewardDays(response)
  assert.equal(stats.totalDays, 8)
  assert.equal(stats.recordedDays, 6)
  assert.equal(stats.rewardDays, 3)
  assert.equal(stats.zeroDays, 3)
  assert.equal(stats.missingDays, 2)
  assert.equal(stats.rewardRate, 50)
  assert.deepEqual(stats.longestZeros, {
    kind: "zero",
    length: 2,
    from: "2026-01-02",
    to: "2026-01-03",
  })
  assert.deepEqual(stats.longestRewards, {
    kind: "reward",
    length: 2,
    from: "2026-01-06",
    to: "2026-01-07",
  })
  assert.equal(stats.latestRun, null)
  assert.equal(stats.bestDay.date, "2026-01-07")
  assert.deepEqual(response, before)
})

test("streaks cross leap days and month boundaries using calendar dates", () => {
  const stats = analyzeRewardDays(
    daily("2024-02-28", "2024-03-01", [
      day("2024-02-28", 50),
      day("2024-02-29", 50),
      day("2024-03-01", 50),
    ])
  )
  assert.equal(stats.latestRun.length, 3)
  assert.equal(stats.rewardRate, 100)
  assert.equal(stats.longestZeros, null)
  assert.equal(stats.bestDay.date, "2024-02-28")
})

test("known zero days and an empty archive produce different analyses", () => {
  const zero = analyzeRewardDays(
    daily("2026-01-01", "2026-01-01", [day("2026-01-01", 0)])
  )
  const unknown = analyzeRewardDays(
    daily("2026-01-01", "2026-01-01", [day("2026-01-01", null)])
  )
  assert.equal(zero.rewardRate, 0)
  assert.equal(zero.latestRun.kind, "zero")
  assert.equal(zero.bestDay.vbucks, 0)
  assert.equal(unknown.rewardRate, null)
  assert.equal(unknown.latestRun, null)
  assert.equal(unknown.bestDay, null)
  assert.throws(() =>
    analyzeRewardDays({
      ...daily("2026-01-01", "2026-01-01", []),
      interval: "month",
    })
  )
  assert.throws(() =>
    buildAnnualComparison(daily("2026-01-01", "2026-01-01", []))
  )
})

test("zone statistics validate coverage, unique zones and known zero-reward periods", () => {
  const response = {
    period: "7d",
    from: "2026-01-01",
    to: "2026-01-07",
    recordedDays: 3,
    totalDays: 7,
    data: [{ zone: "Canny Valley", vbucks: 100, missions: 2 }],
  }
  assert.deepEqual(parseZonesResponse(response), response)
  assert.deepEqual(parseZonesResponse({ ...response, data: [] }).data, [])
  for (const invalid of [
    null,
    {},
    { ...response, period: "bad" },
    { ...response, from: "2026-02-30" },
    { ...response, totalDays: 6 },
    { ...response, recordedDays: 8 },
    { ...response, recordedDays: 0 },
    { ...response, data: [...response.data, ...response.data] },
    { ...response, data: [{ zone: "", vbucks: 50, missions: 1 }] },
    { ...response, data: [{ zone: "Canny Valley", vbucks: 0, missions: 0 }] },
  ])
    assert.throws(() => parseZonesResponse(invalid))
})
