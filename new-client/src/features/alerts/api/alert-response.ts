import type {
  AlertHistoryResponse,
  AlertRewardsResponse,
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

function base(value: unknown): value is Record<string, unknown> & {
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

export function parseRewardsResponse(value: unknown): AlertRewardsResponse {
  if (
    !record(value) ||
    !["7d", "1m", "6m", "1y"].includes(String(value.period)) ||
    !["day", "week", "month"].includes(String(value.interval)) ||
    !date(value.from) ||
    !date(value.to) ||
    value.from > value.to ||
    !Array.isArray(value.data) ||
    value.data.length === 0
  ) {
    throw new Error("Invalid alert rewards response.")
  }
  const { from, to } = value
  if (
    !value.data.every(
      (bucket) =>
        record(bucket) &&
        date(bucket.date) &&
        date(bucket.endDate) &&
        bucket.date >= from &&
        bucket.endDate <= to &&
        bucket.date <= bucket.endDate &&
        integer(bucket.missions) &&
        integer(bucket.recordedDays) &&
        integer(bucket.totalDays) &&
        bucket.totalDays > 0 &&
        bucket.recordedDays <= bucket.totalDays &&
        (bucket.recordedDays === 0
          ? bucket.vbucks === null && bucket.missions === 0
          : nonNegative(bucket.vbucks))
    )
  ) {
    throw new Error("Invalid alert rewards response.")
  }
  return value as unknown as AlertRewardsResponse
}
