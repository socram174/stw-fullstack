import type { DailyReward, MissionAlert, MissionFiltersValue } from "../types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

// Older records use MM/DD/YY, newer ones MM/DD/YYYY. Two-digit years in this
// archive refer to the 2000s. Keep date-only ISO strings to avoid timezone shifts.
export function parseAlertDate(value: unknown): string {
  if (typeof value !== "string") throw new Error("Invalid alert date.")
  const legacy = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(value)
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const rawYear = legacy?.[3] ?? iso?.[1]
  const year = Number(rawYear) + (rawYear?.length === 2 ? 2000 : 0)
  const month = Number(legacy?.[1] ?? iso?.[2])
  const day = Number(legacy?.[2] ?? iso?.[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    !Number.isFinite(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    throw new Error("Invalid alert date.")
  return date.toISOString().slice(0, 10)
}

export function normalizeAlerts(payload: unknown): MissionAlert[] {
  if (!Array.isArray(payload)) throw new Error("Invalid alerts response.")
  return payload.map((value, index) => {
    if (
      !isRecord(value) ||
      typeof value.vbucks !== "number" ||
      !Number.isFinite(value.vbucks) ||
      value.vbucks < 0
    ) {
      throw new Error("Invalid alerts response.")
    }
    const zone = isRecord(value.zone) ? value.zone : {}
    const date = parseAlertDate(value.date)
    return {
      id: typeof value._id === "string" ? value._id : `${date}-${index}`,
      date,
      mission:
        typeof zone.mission === "string" && zone.mission.trim()
          ? zone.mission.trim()
          : value.vbucks > 0
            ? "Alert mission"
            : "No V-Buck missions",
      location: typeof zone.variant === "string" ? zone.variant.trim() : "",
      zone:
        typeof zone.name === "string" && zone.name.trim()
          ? zone.name.trim()
          : "Unknown zone",
      powerLevel:
        typeof value.powerLevel === "number" &&
        Number.isFinite(value.powerLevel)
          ? Math.max(0, value.powerLevel)
          : 0,
      vbucks: value.vbucks,
      afterReset: value.afterReset === true,
    }
  })
}

export function getDailyRewards(alerts: MissionAlert[]): DailyReward[] {
  const days = new Map<string, DailyReward>()
  for (const alert of alerts) {
    const day = days.get(alert.date) ?? {
      date: alert.date,
      vbucks: 0,
      missions: 0,
    }
    day.vbucks += alert.vbucks
    if (alert.vbucks > 0) day.missions += 1
    days.set(alert.date, day)
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export function getAlertStats(alerts: MissionAlert[]) {
  const missions = alerts.filter((alert) => alert.vbucks > 0)
  const levels = missions
    .map((alert) => alert.powerLevel)
    .filter((level) => level > 0)
  return {
    totalVbucks: missions.reduce((total, alert) => total + alert.vbucks, 0),
    missions: missions.length,
    zones: new Set(
      missions
        .map((alert) => alert.zone)
        .filter((zone) => zone !== "Unknown zone")
    ).size,
    minPower: levels.length ? Math.min(...levels) : null,
    days: new Set(alerts.map((alert) => alert.date)).size,
  }
}

function searchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

export function filterAlerts(
  alerts: MissionAlert[],
  filters: MissionFiltersValue,
  from = "",
  to = ""
) {
  const search = searchText(filters.search.trim())
  return alerts
    .filter(
      (alert) =>
        (!filters.zone || alert.zone === filters.zone) &&
        (!from || alert.date >= from) &&
        (!to || alert.date <= to) &&
        (!search ||
          searchText(
            `${alert.mission} ${alert.zone} ${alert.powerLevel}`
          ).includes(search))
    )
    .sort((a, b) => {
      if (filters.sort === "reward")
        return b.vbucks - a.vbucks || b.date.localeCompare(a.date)
      if (filters.sort === "power")
        return a.powerLevel - b.powerLevel || b.date.localeCompare(a.date)
      return b.date.localeCompare(a.date) || b.vbucks - a.vbucks
    })
}

export function getZones(alerts: MissionAlert[]) {
  return [
    ...new Set(
      alerts.filter((alert) => alert.vbucks > 0).map((alert) => alert.zone)
    ),
  ].sort()
}
