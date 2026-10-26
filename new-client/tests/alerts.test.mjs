import assert from "node:assert/strict"
import { test } from "node:test"
import { filterAlerts, getZones } from "../src/features/alerts/lib/alerts.ts"
import {
  parseHistoryResponse,
  parseLatestResponse,
  parseRewardsResponse,
} from "../src/features/alerts/api/alert-response.ts"

const alerts = [
  {
    id: "a",
    date: "2025-12-31",
    vbucks: 30,
    powerLevel: 15,
    zone: "Stonewood",
    mission: "Misión de evacuación",
    location: "Forest",
    afterReset: false,
  },
  {
    id: "b",
    date: "2026-01-01",
    vbucks: 40,
    powerLevel: 70,
    zone: "Canny Valley",
    mission: "Repair the Shelter",
    location: "",
    afterReset: true,
  },
  {
    id: "c",
    date: "2026-01-01",
    vbucks: 35,
    powerLevel: 28,
    zone: "Plankerton",
    mission: "Retrieve the Data",
    location: "",
    afterReset: false,
  },
]
const filters = { search: "", zone: "", sort: "power" }
const summary = {
  totalVbucks: 105,
  missions: 3,
  zones: 3,
  minPower: 15,
  days: 2,
}
const latest = {
  data: alerts,
  rotation: { date: "2026-01-01", afterReset: true },
  summary,
}
const history = {
  data: [alerts[0]],
  summary,
  pagination: { page: 1, limit: 1, total: 3, totalPages: 3 },
  zones: ["Stonewood", "Canny Valley", "Plankerton"],
  dailyRewards: [
    { date: "2025-12-31", vbucks: 30, missions: 1 },
    { date: "2026-01-01", vbucks: 75, missions: 2 },
  ],
}

test("latest API contract preserves explicit rotation metadata", () => {
  assert.deepEqual(parseLatestResponse(latest), latest)
  const empty = {
    data: [],
    summary: { totalVbucks: 0, missions: 0, zones: 0, minPower: null, days: 0 },
    rotation: null,
  }
  assert.deepEqual(parseLatestResponse(empty), empty)
  assert.equal(
    parseLatestResponse({ ...empty, rotation: latest.rotation }).rotation.date,
    "2026-01-01"
  )
})

test("paginated history keeps full-selection totals and chart data", () => {
  const response = parseHistoryResponse(history)
  assert.equal(response.data.length, 1)
  assert.equal(response.pagination.total, 3)
  assert.equal(response.summary.totalVbucks, 105)
  assert.equal(response.dailyRewards.length, 2)
})

test("malformed responses fail instead of displaying zero rewards", () => {
  for (const invalid of [
    null,
    {},
    [],
    { error: { message: "Unavailable" } },
    { ...latest, data: [{ ...alerts[0], vbucks: "30" }] },
    { ...latest, rotation: { date: "01/01/2026", afterReset: false } },
    { ...latest, data: [{ ...alerts[0], date: "2026-02-30" }] },
  ]) {
    assert.throws(() => parseLatestResponse(invalid))
  }
  for (const invalid of [
    latest,
    { ...history, pagination: { ...history.pagination, limit: 0 } },
    { ...history, pagination: { ...history.pagination, page: 4 } },
    {
      ...history,
      dailyRewards: [{ date: "invalid", vbucks: 20, missions: 1 }],
    },
    { ...history, summary: { ...summary, totalVbucks: -1 } },
  ]) {
    assert.throws(() => parseHistoryResponse(invalid))
  }
})

test("daily mission filters combine zone, case-insensitive search and power levels", () => {
  assert.deepEqual(
    filterAlerts(alerts, {
      ...filters,
      zone: "Canny Valley",
      search: " REPAIR ",
    }).map((alert) => alert.id),
    ["b"]
  )
  assert.deepEqual(
    filterAlerts(alerts, { ...filters, search: "MISION" }).map(
      (alert) => alert.id
    ),
    ["a"]
  )
  assert.deepEqual(
    filterAlerts(alerts, { ...filters, search: "70" }).map((alert) => alert.id),
    ["b"]
  )
})

test("daily reward and power sorting do not mutate API data", () => {
  const before = structuredClone(alerts)
  assert.deepEqual(
    filterAlerts(alerts, { ...filters, sort: "reward" }).map(
      (alert) => alert.id
    ),
    ["b", "c", "a"]
  )
  assert.deepEqual(
    filterAlerts(alerts, filters).map((alert) => alert.id),
    ["a", "c", "b"]
  )
  assert.deepEqual(alerts, before)
})

test("zero-reward placeholders do not create a daily zone option", () => {
  assert.deepEqual(
    getZones([
      ...alerts,
      { ...alerts[0], id: "zero", vbucks: 0, zone: "Unknown zone" },
    ]),
    ["Canny Valley", "Plankerton", "Stonewood"]
  )
})

test("chart API preserves missing days, confirmed zero rewards and partial totals", () => {
  const response = {
    period: "7d",
    interval: "day",
    from: "2026-10-19",
    to: "2026-10-25",
    data: [
      {
        date: "2026-10-19",
        endDate: "2026-10-19",
        vbucks: 0,
        missions: 0,
        recordedDays: 1,
        totalDays: 1,
      },
      {
        date: "2026-10-20",
        endDate: "2026-10-20",
        vbucks: null,
        missions: 0,
        recordedDays: 0,
        totalDays: 1,
      },
    ],
  }
  assert.deepEqual(parseRewardsResponse(response), response)
  const partial = {
    ...response,
    period: "6m",
    interval: "week",
    data: [
      {
        date: "2026-10-19",
        endDate: "2026-10-25",
        vbucks: 50,
        missions: 1,
        recordedDays: 3,
        totalDays: 7,
      },
    ],
  }
  assert.deepEqual(parseRewardsResponse(partial), partial)
  for (const invalid of [
    { ...response, period: "all" },
    { ...response, interval: "year" },
    { ...response, from: "2026-02-30" },
    { ...response, data: [{ ...response.data[1], vbucks: 0 }] },
    { ...response, data: [{ ...response.data[0], vbucks: null }] },
    { ...partial, data: [{ ...partial.data[0], recordedDays: 8 }] },
    { ...partial, data: [{ ...partial.data[0], endDate: "2027-01-01" }] },
  ])
    assert.throws(() => parseRewardsResponse(invalid))
})
