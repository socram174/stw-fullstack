import { useEffect, useState } from "react"
import { fetchAlerts } from "../api/alerts-api"
import type { AlertScope, MissionAlert } from "../types"

type AlertsState = {
  status: "loading" | "success" | "error"
  data: MissionAlert[]
}

export function useAlerts(scope: AlertScope) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<AlertsState>({
    status: "loading",
    data: [],
  })

  useEffect(() => {
    const controller = new AbortController()
    fetchAlerts(scope, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ status: "success", data })
      },
      () => {
        if (!controller.signal.aborted) setState({ status: "error", data: [] })
      }
    )
    return () => controller.abort()
  }, [scope, attempt])

  function refetch() {
    setState({ status: "loading", data: [] })
    setAttempt((value) => value + 1)
  }

  return { ...state, refetch }
}
