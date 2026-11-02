import type { RewardBucket } from "@/features/alerts/types"
import { formatDate, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

export function RewardTooltip({ bucket }: { bucket: RewardBucket }) {
  const isPartial =
    bucket.recordedDays > 0 && bucket.recordedDays < bucket.totalDays

  return (
    <div className="min-w-52 space-y-3 rounded-lg border bg-popover px-3 py-2.5 text-xs text-popover-foreground shadow-md">
      <p className="font-medium">
        {formatDate(bucket.date)}
        {bucket.date !== bucket.endDate && ` – ${formatDate(bucket.endDate)}`}
      </p>
      {bucket.vbucks === null ? (
        <p className="text-muted-foreground">No records available</p>
      ) : (
        <dl className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-6">
            <dt className="text-muted-foreground">V-Bucks</dt>
            <dd
              className={cn(
                "font-semibold tabular-nums",
                isPartial ? "text-chart-partial" : "text-primary"
              )}
            >
              {formatNumber(bucket.vbucks)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-6">
            <dt className="text-muted-foreground">Missions</dt>
            <dd className="font-semibold tabular-nums">
              {formatNumber(bucket.missions)}
            </dd>
          </div>
        </dl>
      )}
      <div className="space-y-1.5 border-t pt-2">
        <p className="text-muted-foreground tabular-nums">
          {bucket.recordedDays} of {bucket.totalDays} days recorded
        </p>
        {bucket.recordedDays > 0 && (
          <span
            className={cn(
              "inline-block rounded px-1.5 py-0.5 font-medium",
              isPartial
                ? "bg-chart-partial/10 text-chart-partial"
                : "bg-primary/10 text-primary"
            )}
          >
            {isPartial ? "Partial total" : "Complete total"}
          </span>
        )}
      </div>
    </div>
  )
}
