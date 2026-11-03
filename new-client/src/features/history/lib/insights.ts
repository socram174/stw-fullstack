import type { AlertRewardsResponse, RewardBucket } from "../../alerts/types.ts"
import { shiftCalendarDate } from "./reward-calendar.ts"

export interface AnnualMonth {
  vbucks: number | null
  recordedDays: number
  calendarDays: number
  partial: boolean
  inRange: boolean
}

export function buildAnnualComparison(response: AlertRewardsResponse) {
  if (response.interval !== "month")
    throw new Error("Annual comparison requires monthly data.")
  const years = [
    ...new Set(
      response.data
        .filter((bucket) => bucket.recordedDays > 0)
        .map((bucket) => Number(bucket.date.slice(0, 4)))
    ),
  ].sort((a, b) => b - a)
  const byMonth = new Map(
    response.data.map((bucket) => [bucket.date.slice(0, 7), bucket])
  )
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "UTC",
  })
  const months = Array.from({ length: 12 }, (_, index) => {
    const values: Record<number, AnnualMonth> = {}
    for (const year of years) {
      const bucket = byMonth.get(
        `${year}-${String(index + 1).padStart(2, "0")}`
      )
      const calendarDays = new Date(Date.UTC(year, index + 1, 0)).getUTCDate()
      values[year] = {
        vbucks: bucket?.vbucks ?? null,
        recordedDays: bucket?.recordedDays ?? 0,
        calendarDays,
        partial: (bucket?.recordedDays ?? 0) < calendarDays,
        inRange: Boolean(bucket),
      }
    }
    return {
      month: formatter.format(new Date(Date.UTC(2000, index, 1))),
      values,
    }
  })
  return { years, months }
}

export interface RewardRun {
  kind: "reward" | "zero"
  length: number
  from: string
  to: string
}

function extendRun(
  previous: RewardRun | null,
  kind: RewardRun["kind"],
  date: string
): RewardRun {
  return previous?.kind === kind
    ? { ...previous, to: date, length: previous.length + 1 }
    : { kind, from: date, to: date, length: 1 }
}

export function analyzeRewardDays(response: AlertRewardsResponse) {
  if (response.interval !== "day")
    throw new Error("Streak analysis requires daily data.")
  const days = new Map(response.data.map((day) => [day.date, day]))
  let recordedDays = 0
  let rewardDays = 0
  let totalDays = 0
  let run: RewardRun | null = null
  let longestRewards: RewardRun | null = null
  let longestZeros: RewardRun | null = null
  let bestDay: RewardBucket | null = null

  for (
    let date = response.from;
    date <= response.to;
    date = shiftCalendarDate(date, 1)
  ) {
    totalDays++
    const day = days.get(date)
    if (!day || day.recordedDays !== 1 || day.vbucks === null) {
      run = null
      continue
    }
    recordedDays++
    const kind = day.vbucks > 0 ? "reward" : "zero"
    if (kind === "reward") rewardDays++
    if (!bestDay || day.vbucks > (bestDay.vbucks ?? 0)) bestDay = day
    run = extendRun(run, kind, date)
    if (kind === "reward" && run.length > (longestRewards?.length ?? 0))
      longestRewards = run
    if (kind === "zero" && run.length > (longestZeros?.length ?? 0))
      longestZeros = run
  }

  return {
    recordedDays,
    rewardDays,
    zeroDays: recordedDays - rewardDays,
    totalDays,
    missingDays: totalDays - recordedDays,
    rewardRate: recordedDays ? (rewardDays / recordedDays) * 100 : null,
    longestRewards,
    longestZeros,
    latestRun: run,
    bestDay,
  }
}
