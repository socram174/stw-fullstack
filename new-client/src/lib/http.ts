const apiBaseUrl = (
  import.meta.env.VITE_BASE_APP_URL?.trim() || "/api"
).replace(/\/+$/, "")

export async function apiRequest(
  path: string,
  options: RequestInit = {}
): Promise<unknown> {
  const signal = options.signal
    ? AbortSignal.any([options.signal, AbortSignal.timeout(15_000)])
    : AbortSignal.timeout(15_000)
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    signal,
    headers: { Accept: "application/json", ...options.headers },
  })
  if (!response.ok) throw new Error(`Request failed (${response.status}).`)
  return response.json()
}
