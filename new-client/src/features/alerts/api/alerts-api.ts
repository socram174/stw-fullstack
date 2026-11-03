import { apiRequest } from "@/lib/http"
import {
  parseHistoryResponse,
  parseRewardsResponse,
  parseZonesResponse,
} from "./alert-response"
import { loadLatestAlerts } from "./latest-alerts-cache"
import type { RewardPeriod } from "../types"

export async function fetchLatestAlerts(signal: AbortSignal, force = false) {
  return loadLatestAlerts({
    signal,
    force,
    request: (requestSignal) =>
      apiRequest("/api/v1/alerts/latest", { signal: requestSignal }),
  })
}

export async function fetchAlertHistory(query: string, signal: AbortSignal) {
  return parseHistoryResponse(
    await apiRequest(`/api/v1/alerts?${query}`, { signal })
  )
}

export async function fetchAlertRewards(
  period: RewardPeriod,
  signal: AbortSignal,
  interval?: "day"
) {
  const query = new URLSearchParams({ period })
  if (interval) query.set("interval", interval)
  const response = parseRewardsResponse(
    await apiRequest(`/api/v1/alerts/rewards?${query}`, { signal })
  )
  if (response.period !== period) throw new Error("Unexpected rewards period.")
  if (interval && response.interval !== interval)
    throw new Error("Unexpected rewards interval.")
  return response
}

export async function fetchAlertZones(
  period: RewardPeriod,
  signal: AbortSignal
) {
  const response = parseZonesResponse(
    await apiRequest(`/api/v1/alerts/zones?period=${period}`, { signal })
  )
  if (response.period !== period)
    throw new Error("Unexpected zone statistics period.")
  return response
}
