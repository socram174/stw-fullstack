import { Crosshair, MapPin, RotateCcw, Zap } from "lucide-react"
import { formatNumber } from "@/lib/format"
import type { MissionAlert } from "../types"
import { ZoneBadge } from "./zone-badge"

export function MissionCard({ alert }: { alert: MissionAlert }) {
  return (
    <article className="group flex h-full flex-col rounded-xl border bg-card p-5 transition-colors hover:border-primary/40 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <ZoneBadge zone={alert.zone} />
        <span
          className="inline-flex items-center gap-1 text-xs text-muted-foreground"
          title="Nivel de poder recomendado"
        >
          <Zap className="size-3.5" aria-hidden="true" />
          {alert.powerLevel || "—"} PL
        </span>
      </div>
      <div className="mt-7 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
          <Crosshair className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-base leading-snug font-semibold tracking-tight">
            {alert.mission}
          </h3>
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" aria-hidden="true" />
            {alert.zone}
          </p>
        </div>
      </div>
      {alert.afterReset && (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <RotateCcw className="size-3" aria-hidden="true" />
          Registrada después del reinicio
        </p>
      )}
      <div className="mt-auto pt-6">
        <div className="flex items-center justify-between border-t border-dashed pt-4">
          <span className="text-xs text-muted-foreground">
            Recompensa de alerta
          </span>
          <span className="flex items-baseline gap-1.5 text-primary">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">
              +{formatNumber(alert.vbucks)}
            </span>
            <span className="text-xs font-medium">pavos</span>
          </span>
        </div>
      </div>
    </article>
  )
}
