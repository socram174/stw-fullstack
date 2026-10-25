import { RotateCcw, Zap } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { MissionAlert } from "../types"
import { ZoneBadge } from "./zone-badge"

const desktopColumns = "md:grid-cols-[minmax(0,1fr)_160px_90px_110px]"

function MissionRow({ alert }: { alert: MissionAlert }) {
  return (
    <li
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-4 py-4 transition-colors hover:bg-muted/30 sm:px-5",
        desktopColumns
      )}
    >
      <div className="min-w-0">
        <h3 className="text-sm leading-relaxed font-medium">{alert.mission}</h3>
        {(alert.location || alert.afterReset) && (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-relaxed text-muted-foreground">
            {alert.location && <span>{alert.location}</span>}
            {alert.afterReset && (
              <span className="inline-flex items-center gap-1">
                <RotateCcw className="size-3" aria-hidden="true" />
                Después del reinicio
              </span>
            )}
          </div>
        )}
      </div>
      <div className="col-start-1 row-start-2 flex flex-wrap items-center gap-3 md:col-start-auto md:row-start-auto">
        <ZoneBadge zone={alert.zone} />
        <span
          className="inline-flex items-center gap-1 text-xs text-muted-foreground md:hidden"
          aria-label={`Nivel de poder: ${alert.powerLevel || "desconocido"}`}
        >
          <Zap className="size-3" aria-hidden="true" />
          {alert.powerLevel || "—"} PL
        </span>
      </div>
      <div
        className="hidden text-sm text-muted-foreground tabular-nums md:block"
        aria-label={`Nivel de poder: ${alert.powerLevel || "desconocido"}`}
      >
        {alert.powerLevel || "—"}
        <span className="ml-1 text-xs">PL</span>
      </div>
      <div className="col-start-2 row-span-2 row-start-1 text-right md:col-start-auto md:row-span-1 md:row-start-auto">
        <p className="text-xl font-semibold tracking-tight text-primary tabular-nums">
          +{formatNumber(alert.vbucks)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">pavos</p>
      </div>
    </li>
  )
}

export function MissionList({
  alerts,
  loading = false,
}: {
  alerts: MissionAlert[]
  loading?: boolean
}) {
  return (
    <div
      className="overflow-hidden rounded-lg border bg-card"
      aria-busy={loading}
    >
      <div
        aria-hidden="true"
        className={cn(
          "hidden items-center gap-4 border-b bg-muted/35 px-5 py-3 text-xs font-medium text-muted-foreground md:grid",
          desktopColumns
        )}
      >
        <span>Misión</span>
        <span>Zona</span>
        <span>Nivel</span>
        <span className="text-right">Recompensa</span>
      </div>
      {loading ? (
        <div role="status" aria-label="Cargando misiones">
          <span className="sr-only">Cargando misiones…</span>
          <div className="divide-y" aria-hidden="true">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-6 px-5 py-5"
              >
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/5 max-w-64" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-7 w-12" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ul aria-label="Misiones con pavos" className="divide-y">
          {alerts.map((alert) => (
            <MissionRow key={alert.id} alert={alert} />
          ))}
        </ul>
      )}
    </div>
  )
}
