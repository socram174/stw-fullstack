import { useMemo, useState } from "react"
import { ArrowRight, CalendarDays, RefreshCw } from "lucide-react"
import { Link } from "react-router"
import { Button, buttonVariants } from "@/components/ui/button"
import { FeedbackState } from "@/components/shared/feedback-state"
import { MissionList } from "@/features/alerts/components/mission-list"
import { MissionFilters } from "@/features/alerts/components/mission-filters"
import { RewardSummary } from "@/features/alerts/components/reward-summary"
import { useLatestAlerts } from "@/features/alerts/hooks/use-alerts"
import { filterAlerts, getZones } from "@/features/alerts/lib/alerts"
import type { MissionAlert, MissionFiltersValue } from "@/features/alerts/types"
import { formatDate } from "@/lib/format"

const initialFilters: MissionFiltersValue = {
  search: "",
  zone: "",
  sort: "power",
}

const emptyAlerts: MissionAlert[] = []

export default function TodayPage() {
  const { data: response, status, refetch } = useLatestAlerts()
  const data = response?.data ?? emptyAlerts
  const [filters, setFilters] = useState(initialFilters)
  const stats = response?.summary
  const missions = useMemo(
    () => data.filter((alert) => alert.vbucks > 0),
    [data]
  )
  const filtered = useMemo(
    () => filterAlerts(missions, filters),
    [missions, filters]
  )
  const latestDate = response?.rotation?.date
  const recorded = Boolean(response?.rotation)
  const loading = status === "loading"
  const ready = status === "success"

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <title>V-Buck alerts · STW Alerts</title>
      <meta
        name="description"
        content="Find V-Buck missions in Fortnite Save the World. Check rewards, zones and power levels for the latest recorded rotation."
      />
      <div className="flex items-start justify-between gap-3 sm:items-center">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            V-Buck alerts
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
            {latestDate ? (
              <span>
                Rotation for{" "}
                <time dateTime={latestDate}>{formatDate(latestDate)}</time>
              </span>
            ) : (
              "Latest recorded rotation"
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="size-9 shrink-0 p-0 sm:h-8 sm:w-auto sm:px-2.5"
          aria-label="Refresh alerts"
          title="Refresh alerts"
          onClick={refetch}
          disabled={loading}
        >
          <RefreshCw
            className={loading ? "size-3.5 animate-spin" : "size-3.5"}
            aria-hidden="true"
          />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      <RewardSummary
        total={recorded ? (stats?.totalVbucks ?? null) : null}
        missionCount={recorded ? (stats?.missions ?? null) : null}
        zoneCount={recorded ? (stats?.zones ?? null) : null}
        minimumPower={stats?.minPower ?? null}
        loading={loading}
      />

      <section aria-labelledby="missions-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2
              id="missions-heading"
              className="text-base font-semibold tracking-tight"
            >
              Available missions
            </h2>
            {ready && (
              <span className="flex size-6 items-center justify-center rounded-md border bg-card text-xs font-medium tabular-nums">
                {missions.length}
              </span>
            )}
          </div>
          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            View history
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
        <MissionFilters
          value={filters}
          onChange={setFilters}
          zones={getZones(missions)}
          disabled={!ready}
        />

        {loading && <MissionList alerts={[]} loading />}
        {status === "error" && (
          <FeedbackState
            error
            title="Unable to load alerts"
            description="Alerts are temporarily unavailable. Try again in a moment."
          >
            <Button variant="outline" onClick={refetch}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Try again
            </Button>
          </FeedbackState>
        )}
        {ready && !missions.length && (
          <FeedbackState
            title={
              recorded
                ? "No V-Buck missions in this rotation"
                : "No alerts available yet"
            }
            description={
              recorded
                ? "No V-Buck missions were recorded for this rotation. Explore rewards from previous days in the history."
                : "Missions and rewards will appear here once a rotation has been recorded."
            }
          >
            <Link
              className={buttonVariants({ variant: "outline" })}
              to="/history"
            >
              Explore history
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </FeedbackState>
        )}
        {ready && missions.length > 0 && !filtered.length && (
          <FeedbackState
            title="No missions found"
            description="Try a different search or select another zone."
          >
            <Button
              variant="outline"
              onClick={() => setFilters(initialFilters)}
            >
              Clear filters
            </Button>
          </FeedbackState>
        )}
        {ready && filtered.length > 0 && (
          <>
            <p className="sr-only" role="status">
              {filtered.length} {filtered.length === 1 ? "mission" : "missions"}{" "}
              found
            </p>
            <MissionList alerts={filtered} />
          </>
        )}
      </section>
    </div>
  )
}
