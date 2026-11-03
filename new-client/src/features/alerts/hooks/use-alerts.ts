import { useEffect, useState } from "react"
import {
  fetchAlertHistory,
  fetchLatestAlerts,
  fetchAlertRewards,
  fetchAlertZones,
} from "../api/alerts-api"
import type { RewardChartType, RewardPeriod } from "../types"

type RequestState<T> = {
  key: string
  attempt: number
  status: "success" | "error"
  data: T | null
}

function useAlertRequest<T>(
  key: string,
  fetcher: (key: string, signal: AbortSignal, force: boolean) => Promise<T>
) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<RequestState<T> | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetcher(key, controller.signal, attempt > 0).then(
      (data) => {
        if (!controller.signal.aborted)
          setState({ key, attempt, status: "success", data })
      },
      () => {
        if (!controller.signal.aborted)
          setState({ key, attempt, status: "error", data: null })
      }
    )
    return () => controller.abort()
  }, [key, attempt, fetcher])

  // Do not show the previous page/selection while a new request is pending.
  const current = state?.key === key && state.attempt === attempt ? state : null
  return {
    status: current?.status ?? "loading",
    data: current?.data ?? null,
    // Retain the previous result for sizing loading placeholders only.
    lastData: state?.data ?? null,
    refetch: () => setAttempt((value) => value + 1),
  }
}

const latest = (_key: string, signal: AbortSignal, force: boolean) =>
  fetchLatestAlerts(signal, force)

export function useLatestAlerts() {
  return useAlertRequest("latest", latest)
}

const history = (query: string, signal: AbortSignal) =>
  fetchAlertHistory(query, signal)

export function useAlertHistory(query: string) {
  return useAlertRequest(query, history)
}

const zones = (period: string, signal: AbortSignal) =>
  fetchAlertZones(period as RewardPeriod, signal)

export function useAlertZones(period: RewardPeriod) {
  return useAlertRequest(period, zones)
}

const rewards = (key: string, signal: AbortSignal) => {
  const [period, interval] = key.split(":")
  return fetchAlertRewards(
    period as RewardPeriod,
    signal,
    interval === "day" ? "day" : undefined
  )
}

export function useAlertRewards(
  period: RewardPeriod,
  chartType: RewardChartType = "bars"
) {
  return useAlertRequest(
    chartType === "heatmap" ? `${period}:day` : period,
    rewards
  )
}
