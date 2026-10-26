import { RefreshCw } from "lucide-react"
import { useState } from "react"
import { useSearchParams } from "react-router"
import { Button } from "@/components/ui/button"
import { FeedbackState } from "@/components/shared/feedback-state"
import { PageHeading } from "@/components/shared/page-heading"
import { AlertsSkeleton } from "@/features/alerts/components/alerts-skeleton"
import {
  useAlertHistory,
  useAlertRewards,
} from "@/features/alerts/hooks/use-alerts"
import type { RewardPeriod } from "@/features/alerts/types"
import {
  HistoryFilters,
  type HistoryFiltersValue,
} from "@/features/history/components/history-filters"
import {
  HISTORY_PAGE_SIZE,
  HistoryTable,
} from "@/features/history/components/history-table"
import { RewardChart } from "@/features/history/components/reward-chart"

export default function HistoryPage() {
  const [chartPeriod, setChartPeriod] = useState<RewardPeriod>("1m")
  const chart = useAlertRewards(chartPeriod)
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
        description="Review reward trends by period, then search the mission archive below."
      >
        <Button
          variant="outline"
          onClick={() => {
            refetch()
            chart.refetch()
          }}
          disabled={loading}
        >
          <RefreshCw
            className={loading ? "size-4 animate-spin" : "size-4"}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </PageHeading>

      <RewardChart
        period={chartPeriod}
        onPeriodChange={setChartPeriod}
        response={chart.data}
        status={chart.status}
        onRetry={chart.refetch}
      />

      <section aria-labelledby="history-heading" className="space-y-4">
        <div>
          <h2
            id="history-heading"
            className="text-xl font-semibold tracking-tight"
          >
            Mission archive
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            These filters apply to the table. Days without V-Buck missions are
            kept as zero-reward records.
          </p>
        </div>
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
          <HistoryTable
            alerts={response.data}
            pagination={response.pagination}
            onPageChange={(next) => updateParams({ page: String(next) }, false)}
          />
        )}
      </section>
    </div>
  )
}
