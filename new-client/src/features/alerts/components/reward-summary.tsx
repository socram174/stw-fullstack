import { Coins, Crosshair } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate, formatNumber } from "@/lib/format"

export function RewardSummary({
  total,
  date,
  loading,
}: {
  total: number | null
  date?: string
  loading: boolean
}) {
  return (
    <div className="relative isolate overflow-hidden rounded-2xl bg-[#102d24] p-7 text-white sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -right-16 -z-10 size-72 rounded-full border border-white/10"
      >
        <div className="absolute inset-8 rounded-full border border-white/10" />
        <div className="absolute inset-16 rounded-full border border-white/10" />
      </div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-medium tracking-[0.12em] text-emerald-100/70 uppercase">
          Pavos disponibles
        </p>
        <Coins className="size-5 text-emerald-300" aria-hidden="true" />
      </div>
      {loading ? (
        <Skeleton className="mt-6 mb-2 h-16 w-28 bg-white/10" />
      ) : (
        <p className="mt-5 text-7xl leading-none font-semibold tracking-[-0.06em] tabular-nums">
          {total === null ? "—" : formatNumber(total)}
          <span className="ml-2 text-sm font-normal tracking-normal text-emerald-100/70">
            pavos
          </span>
        </p>
      )}
      <div className="mt-7 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-emerald-100/70">
        <Crosshair
          className="size-3.5 shrink-0 text-emerald-300"
          aria-hidden="true"
        />
        <span>
          {date
            ? `Rotación del ${formatDate(date, { day: "numeric", month: "long" })}`
            : "Última rotación registrada"}
        </span>
      </div>
    </div>
  )
}
