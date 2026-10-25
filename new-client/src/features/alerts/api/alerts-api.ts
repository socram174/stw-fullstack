import { apiRequest } from "@/lib/http"
import { parseHistoryResponse, parseLatestResponse } from "./alert-response"

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
