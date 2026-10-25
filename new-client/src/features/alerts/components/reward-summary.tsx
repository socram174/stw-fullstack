import { Skeleton } from "@/components/ui/skeleton"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

export function RewardSummary({
  total,
  missionCount,
  zoneCount,
  minimumPower,
  loading,
}: {
  total: number | null
  missionCount: number | null
  zoneCount: number | null
  minimumPower: number | null
  loading: boolean
}) {
  return (
    <dl
      aria-label="Rotation summary"
      className="grid grid-cols-2 overflow-hidden rounded-lg border bg-card sm:grid-cols-4"
    >
      {[
        { label: "Available V-Bucks", value: total, unit: "V-Bucks" },
        { label: "Missions", value: missionCount },
        { label: "Zones", value: zoneCount },
        { label: "Min. power level", value: minimumPower, unit: "PL" },
      ].map(({ label, value, unit }, index) => (
        <div
          key={label}
          className={cn(
            "px-4 py-4 sm:px-5 sm:py-5",
            index < 2 && "border-b sm:border-b-0",
            index % 2 === 0 && "border-r",
            index === 1 && "sm:border-r",
            index === 0 && "bg-primary/[0.04]"
          )}
        >
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd
            className={cn(
              "mt-2 flex items-baseline gap-1.5 text-2xl font-semibold tracking-tight tabular-nums",
              index === 0 && "text-primary"
            )}
          >
            {loading ? (
              <Skeleton className="h-8 w-14" />
            ) : (
              <>
                {value === null ? "—" : formatNumber(value)}
                {value !== null && unit && (
                  <span className="text-xs font-normal tracking-normal text-muted-foreground">
                    {unit}
                  </span>
                )}
              </>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
