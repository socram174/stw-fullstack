import { apiRequest } from "@/lib/http"
import { normalizeAlerts } from "../lib/alerts"
import type { AlertScope } from "../types"

export async function fetchAlerts(scope: AlertScope, signal: AbortSignal) {
  // Despite its name, /update is a read endpoint for the latest stored rotation.
  const payload = await apiRequest(
    scope === "today" ? "/alerts/update" : "/alerts",
    {
      method: scope === "today" ? "POST" : "GET",
      signal,
    }
  )
  return normalizeAlerts(payload)
}
