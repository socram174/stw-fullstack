import assert from "node:assert/strict"
import { test } from "node:test"
import {
  buildRewardCalendar,
  rewardIntensity,
  shiftCalendarDate,
} from "../src/features/history/lib/reward-calendar.ts"
import { parseRewardsResponse } from "../src/features/alerts/api/alert-response.ts"

function response(from, to, data = []) {
  return { period: "all", interval: "day", from, to, data }
}

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

const visibleDays = (year) => year.weeks.flat().filter(Boolean)

test("calendar aligns Sunday columns and pads only outside the selected range", () => {
  const [calendar] = buildRewardCalendar(response("2026-10-30", "2026-11-02"))
  assert.equal(calendar.weeks.length, 2)
  assert.equal(calendar.weeks[0][0], null)
  assert.equal(calendar.weeks[0][5].date, "2026-10-30")
  assert.equal(calendar.weeks[1][0].date, "2026-11-01")
  assert.equal(calendar.weeks[1][1].date, "2026-11-02")
  assert.equal(calendar.weeks[1][2], null)
  assert.equal(visibleDays(calendar).length, 4)
})

test("calendar preserves known zeros, unknown dates and exact daily rewards", () => {
  const [calendar] = buildRewardCalendar(
    response("2026-10-01", "2026-10-03", [
      day("2026-10-01", 0),
      day("2026-10-03", 125),
    ])
  )
  const days = visibleDays(calendar)
  assert.equal(days[0].vbucks, 0)
  assert.equal(days[0].recordedDays, 1)
  assert.equal(days[1].vbucks, null)
  assert.equal(days[1].recordedDays, 0)
  assert.equal(days[2].vbucks, 125)
  assert.equal(days[2].missions, 1)
})

test("all-time calendar splits years without losing or duplicating leap days", () => {
  const calendars = buildRewardCalendar(
    response("2023-12-31", "2025-01-01", [day("2024-02-29", 50)])
  )
  assert.deepEqual(
    calendars.map((calendar) => calendar.year),
    [2023, 2024, 2025]
  )
  assert.deepEqual(
    calendars.map((calendar) => visibleDays(calendar).length),
    [1, 366, 1]
  )
  assert.equal(
    visibleDays(calendars[1]).find((day) => day.date === "2024-02-29").vbucks,
    50
  )
  const dates = calendars.flatMap(visibleDays).map((day) => day.date)
  assert.equal(new Set(dates).size, dates.length)
  assert.equal(shiftCalendarDate("2024-02-28", 1), "2024-02-29")
  assert.equal(shiftCalendarDate("2024-03-01", -1), "2024-02-29")
})

test("intensity thresholds stay consistent across periods and distinguish missing from zero", () => {
  assert.deepEqual(
    [null, 0, 1, 50, 51, 100, 101, 150, 151, 1000].map(rewardIntensity),
    [null, 0, 1, 1, 2, 2, 3, 3, 4, 4]
  )
})

test("short ranges crossing months leave room for month labels", () => {
  const [calendar] = buildRewardCalendar(response("2026-10-27", "2026-11-02"))
  assert.deepEqual(calendar.months, [{ label: "Nov", column: 1 }])
})

test("aggregated buckets cannot be displayed as daily heatmap data", () => {
  assert.throws(() =>
    buildRewardCalendar({
      ...response("2026-01-01", "2026-01-31"),
      interval: "month",
    })
  )
  assert.throws(() =>
    parseRewardsResponse(
      response("2026-01-01", "2026-01-31", [
        { ...day("2026-01-01", 50), endDate: "2026-01-31", totalDays: 31 },
      ])
    )
  )
})
