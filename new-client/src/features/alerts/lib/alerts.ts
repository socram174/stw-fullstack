import type { MissionAlert, MissionFiltersValue } from "../types"

function searchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

export function filterAlerts(
  alerts: MissionAlert[],
  filters: MissionFiltersValue
) {
  const search = searchText(filters.search.trim())
  return alerts
    .filter(
      (alert) =>
        (!filters.zone || alert.zone === filters.zone) &&
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
