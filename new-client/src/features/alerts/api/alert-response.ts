import type {
  AlertHistoryResponse,
  AlertSummary,
  LatestAlertsResponse,
  MissionAlert,
} from "../types.ts"

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function nonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
}

function integer(value: unknown): value is number {
  return nonNegative(value) && Number.isSafeInteger(value)
}

function date(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  )
}

function mission(value: unknown): value is MissionAlert {
  return (
    record(value) &&
    ["id", "mission", "location", "zone"].every(
      (key) => typeof value[key] === "string"
    ) &&
    date(value.date) &&
    nonNegative(value.powerLevel) &&
    nonNegative(value.vbucks) &&
    typeof value.afterReset === "boolean"
  )
}

function summary(value: unknown): value is AlertSummary {
  return (
    record(value) &&
    nonNegative(value.totalVbucks) &&
    integer(value.missions) &&
    integer(value.zones) &&
    integer(value.days) &&
    (value.minPower === null || nonNegative(value.minPower))
  )
}

function base(
  value: unknown
): value is Record<string, unknown> & {
  data: MissionAlert[]
  summary: AlertSummary
} {
  return (
    record(value) &&
    Array.isArray(value.data) &&
    value.data.every(mission) &&
    summary(value.summary)
  )
}

export function parseLatestResponse(value: unknown): LatestAlertsResponse {
  if (
    !base(value) ||
    !(
      value.rotation === null ||
      (record(value.rotation) &&
        date(value.rotation.date) &&
        typeof value.rotation.afterReset === "boolean")
    )
  ) {
    throw new Error("Invalid latest alerts response.")
  }
  return value as unknown as LatestAlertsResponse
}

export function parseHistoryResponse(value: unknown): AlertHistoryResponse {
  if (
    !base(value) ||
    !record(value.pagination) ||
    !integer(value.pagination.page) ||
    value.pagination.page < 1 ||
    !integer(value.pagination.limit) ||
    value.pagination.limit < 1 ||
    !integer(value.pagination.total) ||
    !integer(value.pagination.totalPages) ||
    value.pagination.totalPages < 1 ||
    value.pagination.page > value.pagination.totalPages ||
    value.data.length > value.pagination.limit ||
    !Array.isArray(value.zones) ||
    !value.zones.every((zone) => typeof zone === "string") ||
    !Array.isArray(value.dailyRewards) ||
    !value.dailyRewards.every(
      (day) =>
        record(day) &&
        date(day.date) &&
        nonNegative(day.vbucks) &&
        integer(day.missions)
    )
  ) {
    throw new Error("Invalid alert history response.")
  }
  return value as unknown as AlertHistoryResponse
}
