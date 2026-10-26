import { apiRequest } from "@/lib/http"
import {
  parseHistoryResponse,
  parseLatestResponse,
  parseRewardsResponse,
} from "./alert-response"
import type { RewardPeriod } from "../types"

export async function fetchLatestAlerts(signal: AbortSignal) {
  return parseLatestResponse(
    await apiRequest("/api/v1/alerts/latest", { signal })
  )
}

export async function fetchAlertHistory(query: string, signal: AbortSignal) {
  return parseHistoryResponse(
    await apiRequest(`/api/v1/alerts?${query}`, { signal })
  )
}

export async function fetchAlertRewards(
  period: RewardPeriod,
  signal: AbortSignal
) {
  const response = parseRewardsResponse(
    await apiRequest(`/api/v1/alerts/rewards?period=${period}`, { signal })
  )
  if (response.period !== period) throw new Error("Unexpected rewards period.")
  return response
}
