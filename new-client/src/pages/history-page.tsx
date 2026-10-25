import { CalendarDays, Coins, Crosshair, RefreshCw } from "lucide-react"
import { useSearchParams } from "react-router"
import { Button } from "@/components/ui/button"
import { FeedbackState } from "@/components/shared/feedback-state"
import { PageHeading } from "@/components/shared/page-heading"
import { StatCard } from "@/components/shared/stat-card"
import { AlertsSkeleton } from "@/features/alerts/components/alerts-skeleton"
import { useAlertHistory } from "@/features/alerts/hooks/use-alerts"
import {
  HistoryFilters,
  type HistoryFiltersValue,
} from "@/features/history/components/history-filters"
import {
  HISTORY_PAGE_SIZE,
  HistoryTable,
} from "@/features/history/components/history-table"
import { RewardChart } from "@/features/history/components/reward-chart"
import { formatNumber } from "@/lib/format"

export default function HistoryPage() {
  const [params, setParams] = useSearchParams()
  const search = params.get("q") ?? ""
  const zone = params.get("zone") ?? ""
  const sortParam = params.get("sort")
  const sort =
    sortParam === "power" || sortParam === "reward" ? sortParam : "recent"
  const from = params.get("from") ?? ""
  const to = params.get("to") ?? ""
  const pageParam = Number(params.get("page"))
  const page = Number.isSafeInteger(pageParam) && pageParam > 0 ? pageParam : 1
  const query = new URLSearchParams({
    sort,
    page: String(page),
    limit: String(HISTORY_PAGE_SIZE),
  })
  for (const [key, value] of Object.entries({ q: search, zone, from, to })) {
    if (value) query.set(key, value)
  }
  const { data: response, status, refetch } = useAlertHistory(query.toString())
  const stats = response?.summary
  const total = response?.pagination.total ?? 0
  const hasFilters = Boolean(search || zone || from || to || sort !== "recent")
  const loading = status === "loading"
  const ready = status === "success"

  function updateParams(values: Record<string, string>, replace = true) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        next.delete("page")
        for (const [key, value] of Object.entries(values)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        return next
      },
      { replace }
    )
  }

  function updateFilters(value: HistoryFiltersValue) {
    updateParams({
      q: value.search,
      zone: value.zone,
      sort: value.sort === "recent" ? "" : value.sort,
      from: value.from,
      to: value.to,
    })
  }

  return (
    <div className="space-y-8">
      <title>V-Buck history · STW Alerts</title>
      <meta
        name="description"
        content="Explore past V-Buck missions in Save the World. Filter by date and zone to review recorded rewards."
      />
      <PageHeading
        eyebrow="Your mission archive"
        title={
          <>
            Every rotation, <span className="text-primary">at a glance.</span>
          </>
        }
        description="Explore past missions and their rewards. Filter by date or zone to browse the archive."
      >
        <Button variant="outline" onClick={refetch} disabled={loading}>
          <RefreshCw
            className={loading ? "size-4 animate-spin" : "size-4"}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </PageHeading>

      <HistoryFilters
        key={JSON.stringify([search, zone, sort, from, to])}
        value={{ search, zone, sort, from, to }}
        zones={response?.zones ?? []}
        disabled={loading}
        loading={loading}
        error={status === "error"}
        resultCount={total}
        onApply={updateFilters}
        onClear={() => setParams({}, { replace: true })}
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard
          label="V-Bucks recorded"
          value={stats ? formatNumber(stats.totalVbucks) : "—"}
          description="Rewards in the current selection"
          icon={Coins}
          loading={loading}
        />
        <StatCard
          label="V-Buck missions"
          value={stats ? formatNumber(stats.missions) : "—"}
          description="Excluding days with no rewards"
          icon={Crosshair}
          loading={loading}
        />
        <StatCard
          label="Days recorded"
          value={stats ? formatNumber(stats.days) : "—"}
          description="Recorded dates in this selection"
          icon={CalendarDays}
          loading={loading}
        />
      </div>

      {loading && <AlertsSkeleton />}
      {status === "error" && (
        <FeedbackState
          error
          title="Unable to load history"
          description="Records are temporarily unavailable. Try again in a moment."
        >
          <Button variant="outline" onClick={refetch}>
            Try again
          </Button>
        </FeedbackState>
      )}
      {ready && total === 0 && (
        <FeedbackState
          title={
            hasFilters
              ? "No records match these filters"
              : "No history available yet"
          }
          description={
            hasFilters
              ? "Try different dates, another zone or a broader search."
              : "Alerts will appear here as new rotations are recorded."
          }
        >
          {hasFilters && (
            <Button
              variant="outline"
              onClick={() => setParams({}, { replace: true })}
            >
              Clear filters
            </Button>
          )}
        </FeedbackState>
      )}
      {ready && response && total > 0 && (
        <>
          <RewardChart days={response.dailyRewards} />
          <section aria-labelledby="history-heading" className="space-y-4">
            <div>
              <h2
                id="history-heading"
                className="text-xl font-semibold tracking-tight"
              >
                All alerts
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Days without V-Buck missions are kept as zero-reward records.
              </p>
            </div>
            <HistoryTable
              alerts={response.data}
              pagination={response.pagination}
              onPageChange={(next) =>
                updateParams({ page: String(next) }, false)
              }
            />
          </section>
        </>
      )}
    </div>
  )
}
