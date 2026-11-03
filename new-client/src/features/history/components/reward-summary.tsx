import { CalendarDays, Coins, Crosshair } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import type { RewardBucket } from "@/features/alerts/types"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { summarizeRewardBuckets } from "../lib/reward-summary"

interface RewardSummaryProps {
  buckets: RewardBucket[] | null
  loading: boolean
}

export function RewardSummary({ buckets, loading }: RewardSummaryProps) {
  const totals = buckets ? summarizeRewardBuckets(buckets) : null
  const totalDays =
    buckets?.reduce((total, bucket) => total + bucket.totalDays, 0) ?? 0
  const hasRecords = totals !== null && totals.days > 0
  const isPartial = hasRecords && totals.days < totalDays
  const coverage = totalDays > 0 && totals ? (totals.days / totalDays) * 100 : 0
  const rewardColor = hasRecords
    ? isPartial
      ? "text-chart-partial"
      : "text-primary"
    : "text-muted-foreground"

  return (
    <section
      className="mb-7 rounded-xl border bg-card p-4 sm:p-5"
      aria-label="Selected period totals"
      aria-busy={loading}
    >
      <div className="mb-4 flex min-h-5 flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Selected period
          {!loading &&
            totalDays > 0 &&
            ` · ${formatNumber(totalDays)} ${totalDays === 1 ? "day" : "days"}`}
        </p>
        {loading ? (
          <Skeleton className="h-5 w-24" />
        ) : (
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium",
              hasRecords
                ? isPartial
                  ? "bg-chart-partial/10 text-chart-partial"
                  : "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {hasRecords
              ? isPartial
                ? "Partial records"
                : "Complete records"
              : buckets
                ? "No records"
                : "Unavailable"}
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-[1.1fr_1fr] sm:items-center sm:gap-6">
        <dl className="min-w-0 border-b pb-4 sm:border-r sm:border-b-0 sm:pr-6 sm:pb-0">
          <dt className="flex items-center gap-2 text-xs text-muted-foreground">
            <Coins
              className={cn("size-4 shrink-0", rewardColor)}
              aria-hidden="true"
            />
            Recorded rewards
          </dt>
          <dd className="mt-3 flex min-h-12 flex-wrap items-baseline gap-x-2 gap-y-1">
            {loading ? (
              <Skeleton className="h-11 w-36" />
            ) : (
              <span
                className={cn(
                  "text-4xl font-semibold tracking-tight tabular-nums sm:text-[2.625rem]",
                  rewardColor
                )}
              >
                {hasRecords ? formatNumber(totals.totalVbucks) : "—"}
              </span>
            )}
            <span className="text-xs text-muted-foreground">V-Bucks</span>
          </dd>
        </dl>

        <div className="min-w-0 space-y-4">
          <dl className="flex min-h-7 items-center justify-between gap-3">
            <dt className="flex items-center gap-2 text-xs text-muted-foreground">
              <Crosshair
                className="size-4 shrink-0 text-blue-700 dark:text-blue-300"
                aria-hidden="true"
              />
              V-Buck missions
            </dt>
            <dd className="text-xl font-semibold tabular-nums">
              {loading ? (
                <Skeleton className="h-6 w-10" />
              ) : hasRecords ? (
                formatNumber(totals.missions)
              ) : (
                "—"
              )}
            </dd>
          </dl>
          <div>
            <dl className="flex min-h-7 items-center justify-between gap-3">
              <dt
                className="flex items-center gap-2 text-xs text-muted-foreground"
                title="Includes recorded days with zero V-Bucks."
              >
                <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
                Days recorded
              </dt>
              <dd className="shrink-0 text-xl font-semibold tabular-nums">
                {loading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <>
                    {totals ? formatNumber(totals.days) : "—"}
                    <span className="text-muted-foreground">
                      {" "}
                      / {totalDays > 0 ? formatNumber(totalDays) : "—"}
                    </span>
                  </>
                )}
              </dd>
            </dl>
            {loading ? (
              <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
            ) : totalDays > 0 && totals ? (
              <Progress
                value={coverage}
                aria-label="Recording coverage"
                aria-valuetext={`${formatNumber(totals.days)} of ${formatNumber(totalDays)} days recorded. Includes days with zero V-Bucks.`}
                className={cn(
                  "mt-2",
                  isPartial &&
                    "[&_[data-slot=progress-indicator]]:bg-chart-partial"
                )}
              />
            ) : (
              <div
                className="mt-2 h-1.5 rounded-full bg-muted"
                aria-hidden="true"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
