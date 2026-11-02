import type { AlertRewardsResponse, RewardBucket } from "../../alerts/types.ts"

const dayMilliseconds = 86_400_000
const iso = (date: Date) => date.toISOString().slice(0, 10)

export interface RewardCalendarYear {
  year: number
  from: string
  to: string
  weeks: (RewardBucket | null)[][]
  months: { label: string; column: number }[]
}

export function rewardIntensity(vbucks: number | null) {
  if (vbucks === null) return null
  if (vbucks === 0) return 0
  if (vbucks <= 50) return 1
  if (vbucks <= 100) return 2
  if (vbucks <= 150) return 3
  return 4
}

export function shiftCalendarDate(date: string, days: number) {
  return iso(
    new Date(new Date(`${date}T00:00:00Z`).getTime() + days * dayMilliseconds)
  )
}

export function buildRewardCalendar(response: AlertRewardsResponse) {
  if (response.interval !== "day")
    throw new Error("The reward calendar requires daily data.")

  const days = new Map(response.data.map((day) => [day.date, day]))
  const years: RewardCalendarYear[] = []
  const monthFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "UTC",
  })

  for (
    let year = Number(response.from.slice(0, 4));
    year <= Number(response.to.slice(0, 4));
    year++
  ) {
    const from =
      response.from > `${year}-01-01` ? response.from : `${year}-01-01`
    const to = response.to < `${year}-12-31` ? response.to : `${year}-12-31`
    const offset = new Date(`${from}T00:00:00Z`).getUTCDay()
    const weeks: RewardCalendarYear["weeks"] = []
    const months: RewardCalendarYear["months"] = []
    let index = offset

    for (
      let date = from;
      date <= to;
      date = shiftCalendarDate(date, 1), index++
    ) {
      const column = Math.floor(index / 7)
      if (!weeks[column])
        weeks[column] = Array<RewardBucket | null>(7).fill(null)
      weeks[column][index % 7] = days.get(date) ?? {
        date,
        endDate: date,
        vbucks: null,
        missions: 0,
        recordedDays: 0,
        totalDays: 1,
      }
      if (date === from || date.endsWith("-01")) {
        if (months.at(-1)?.column !== column) {
          // Leave room for labels near the beginning of a partial month.
          if (column - (months.at(-1)?.column ?? -3) < 3) months.pop()
          months.push({
            label: monthFormatter.format(new Date(`${date}T00:00:00Z`)),
            column,
          })
        }
      }
    }
    years.push({ year, from, to, weeks, months })
  }
  return years
}
