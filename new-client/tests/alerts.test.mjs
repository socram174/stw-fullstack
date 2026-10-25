import assert from "node:assert/strict"
import { test } from "node:test"
import {
  filterAlerts,
  getAlertStats,
  getDailyRewards,
  getZones,
  normalizeAlerts,
  parseAlertDate,
} from "../src/features/alerts/lib/alerts.ts"

const payload = [
  {
    _id: "a",
    date: "12/31/2025",
    vbucks: 30,
    powerLevel: 15,
    zone: { name: "Stonewood", mission: "Rescata a los supervivientes" },
  },
  {
    _id: "b",
    date: "01/01/2026",
    vbucks: 40,
    powerLevel: 70,
    zone: { name: "Canny Valley", mission: "Repara el refugio" },
    afterReset: true,
  },
  {
    _id: "c",
    date: "01/01/2026",
    vbucks: 35,
    powerLevel: 28,
    zone: { name: "Plankerton", mission: "Recupera los datos" },
  },
  { _id: "zero", date: "01/02/2026", vbucks: 0, zone: 0 },
]
const filters = { search: "", zone: "", sort: "recent" }

test("legacy calendar dates cross years without timezone conversion", () => {
  assert.equal(parseAlertDate("12/31/2025"), "2025-12-31")
  assert.equal(parseAlertDate("1/1/2026"), "2026-01-01")
  assert.equal(parseAlertDate("11/27/22"), "2022-11-27")
  assert.equal(parseAlertDate("12/09/22"), "2022-12-09")
  assert.equal(parseAlertDate("2024-02-29"), "2024-02-29")
  for (const date of [
    "02/29/2025",
    "02/30/2024",
    "13/01/2026",
    "2026-04-31",
    "",
    null,
  ]) {
    assert.throws(() => parseAlertDate(date))
  }
})

test("zero reward placeholders preserve their day without creating a mission", () => {
  const alerts = normalizeAlerts(payload)
  const zero = alerts.find((alert) => alert.id === "zero")
  assert.equal(zero.mission, "Sin misiones con pavos")
  assert.equal(zero.zone, "Sin zona")
  assert.deepEqual(getAlertStats(alerts), {
    totalVbucks: 105,
    missions: 3,
    zones: 3,
    minPower: 15,
    days: 3,
  })
  assert.deepEqual(getZones(alerts), [
    "Canny Valley",
    "Plankerton",
    "Stonewood",
  ])
})

test("historical two-digit years normalize alongside current dates without losing rewards", () => {
  const historical = [
    { ...payload[0], _id: "old-a", date: "12/09/22", vbucks: 30 },
    { ...payload[1], _id: "old-b", date: "12/09/2022", vbucks: 40 },
    { _id: "old-zero", date: "12/24/22", vbucks: 0, zone: "N/A" },
    ...payload,
  ]
  const alerts = normalizeAlerts(historical)
  assert.equal(alerts.length, historical.length)
  assert.equal(getAlertStats(alerts).totalVbucks, 175)
  assert.deepEqual(getDailyRewards(alerts).slice(0, 2), [
    { date: "2022-12-09", vbucks: 70, missions: 2 },
    { date: "2022-12-24", vbucks: 0, missions: 0 },
  ])
})

test("daily totals combine missions and retain recorded days with zero rewards", () => {
  const days = getDailyRewards(normalizeAlerts([...payload].reverse()))
  assert.deepEqual(days, [
    { date: "2025-12-31", vbucks: 30, missions: 1 },
    { date: "2026-01-01", vbucks: 75, missions: 2 },
    { date: "2026-01-02", vbucks: 0, missions: 0 },
  ])
})

test("zone, search and inclusive date filters can be combined", () => {
  const alerts = normalizeAlerts(payload)
  const matches = filterAlerts(
    alerts,
    { ...filters, zone: "Canny Valley", search: "REPARA" },
    "2026-01-01",
    "2026-01-01"
  )
  assert.deepEqual(
    matches.map((alert) => alert.id),
    ["b"]
  )
  assert.deepEqual(
    filterAlerts(alerts, filters, "2026-02-01", "2026-01-01"),
    []
  )
})

test("search handles accents and power levels", () => {
  const alerts = normalizeAlerts([
    {
      ...payload[0],
      zone: { name: "Stonewood", mission: "Misión de evacuación" },
    },
  ])
  assert.equal(
    filterAlerts(alerts, { ...filters, search: " MISION " }).length,
    1
  )
  assert.equal(filterAlerts(alerts, { ...filters, search: "15" }).length, 1)
  assert.equal(filterAlerts(alerts, { ...filters, search: "28" }).length, 0)
})

test("reward and power sorting do not mutate the response", () => {
  const alerts = normalizeAlerts(payload).filter((alert) => alert.vbucks > 0)
  const ids = alerts.map((alert) => alert.id)
  assert.deepEqual(
    filterAlerts(alerts, { ...filters, sort: "reward" }).map(
      (alert) => alert.id
    ),
    ["b", "c", "a"]
  )
  assert.deepEqual(
    filterAlerts(alerts, { ...filters, sort: "power" }).map(
      (alert) => alert.id
    ),
    ["a", "c", "b"]
  )
  assert.deepEqual(
    alerts.map((alert) => alert.id),
    ids
  )
})

test("missing power levels do not become the minimum recommended level", () => {
  const alerts = normalizeAlerts([
    { ...payload[0], powerLevel: undefined },
    payload[1],
  ])
  assert.equal(getAlertStats(alerts).minPower, 70)
})

test("malformed API responses fail instead of displaying zero rewards", () => {
  for (const invalid of [
    null,
    {},
    { message: "Server error" },
    [null],
    [{ date: "01/01/2026", vbucks: "40" }],
    [{ date: "01/01/2026", vbucks: -1 }],
    [{ date: "01/01/2026", vbucks: Infinity }],
  ]) {
    assert.throws(() => normalizeAlerts(invalid))
  }
  assert.deepEqual(normalizeAlerts([]), [])
})

test("after-reset markers and unknown zones survive normalization", () => {
  const [alert] = normalizeAlerts([
    { ...payload[1], zone: { name: "New region", mission: "Defensa" } },
  ])
  assert.equal(alert.afterReset, true)
  assert.equal(alert.zone, "New region")
})

test("scraped mission and zone names are trimmed before filtering and grouping", () => {
  const alerts = normalizeAlerts([
    {
      ...payload[0],
      zone: {
        name: "    Canny Valley",
        mission: "    Repair the Shelter   ",
        variant: " Thunder Route 99 ",
      },
    },
    {
      ...payload[1],
      zone: { name: "Canny Valley  ", mission: "Repair the Shelter" },
    },
  ])
  assert.equal(alerts[0].mission, "Repair the Shelter")
  assert.equal(alerts[0].location, "Thunder Route 99")
  assert.equal(alerts[1].location, "")
  assert.deepEqual(getZones(alerts), ["Canny Valley"])
  assert.equal(
    filterAlerts(alerts, { ...filters, zone: "Canny Valley" }).length,
    2
  )
  assert.equal(getAlertStats(alerts).zones, 1)
})
