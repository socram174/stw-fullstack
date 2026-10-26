import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatDate } from "@/lib/format"
import type {
  AlertRewardsResponse,
  RewardPeriod,
} from "@/features/alerts/types"
import { RewardBars } from "./reward-bars"

const periods: { value: RewardPeriod; label: string; description: string }[] = [
  { value: "7d", label: "7D", description: "Last 7 days" },
  { value: "1m", label: "1M", description: "Last 30 days" },
  { value: "6m", label: "6M", description: "Last 6 months" },
  { value: "1y", label: "1Y", description: "Last year" },
]

interface RewardChartProps {
  period: RewardPeriod
  onPeriodChange: (period: RewardPeriod) => void
  response: AlertRewardsResponse | null
  status: string
  onRetry: () => void
}

export function RewardChart({
  period,
  onPeriodChange,
  response,
  status,
  onRetry,
}: RewardChartProps) {
  const hasRecords = response?.data.some((bucket) => bucket.recordedDays > 0)
  const interval =
    period === "6m" ? "Weekly" : period === "1y" ? "Monthly" : "Daily"

  return (
    <section
      className="rounded-xl border bg-card p-5 sm:p-6"
      aria-labelledby="chart-heading"
      aria-busy={status === "loading"}
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="chart-heading" className="font-semibold tracking-tight">
            V-Buck rewards
          </h2>
          <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
            {interval} totals across all zones. Independent of table filters.
          </p>
        </div>
        <ToggleGroup
          value={[period]}
          onValueChange={(values) => {
            const selected = periods.find((item) => item.value === values[0])
            if (selected) onPeriodChange(selected.value)
          }}
          aria-label="Chart period"
          variant="outline"
          size="sm"
          spacing={0}
        >
          {periods.map((item) => (
            <ToggleGroupItem
              key={item.value}
              value={item.value}
              aria-label={item.description}
              title={item.description}
              className="min-w-11 data-pressed:bg-primary data-pressed:text-primary-foreground"
            >
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {status === "loading" && (
        <Skeleton className="h-56 w-full" aria-label="Loading rewards chart" />
      )}
      {status === "error" && (
        <div
          className="flex h-56 flex-col items-center justify-center gap-3 text-center"
          role="alert"
        >
          <p className="text-sm text-muted-foreground">
            Unable to load the rewards chart.
          </p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
      {status === "success" && response && (
        <>
          {hasRecords ? (
            <RewardBars response={response} />
          ) : (
            <div
              className="flex h-56 items-center justify-center text-sm text-muted-foreground"
              role="status"
            >
              No records available for this period.
            </div>
          )}
          <div className="mt-5 flex flex-wrap justify-between gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <p>
              {formatDate(response.from, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              –{" "}
              {formatDate(response.to, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            {hasRecords && (
              <p>Missing records are not counted as zero rewards.</p>
            )}
          </div>
        </>
      )}
    </section>
  )
}
