import { useMemo, useState } from "react"
import { ArrowRight, CalendarDays, RefreshCw } from "lucide-react"
import { Link } from "react-router"
import { Button, buttonVariants } from "@/components/ui/button"
import { FeedbackState } from "@/components/shared/feedback-state"
import { MissionList } from "@/features/alerts/components/mission-list"
import { MissionFilters } from "@/features/alerts/components/mission-filters"
import { RewardSummary } from "@/features/alerts/components/reward-summary"
import { useAlerts } from "@/features/alerts/hooks/use-alerts"
import {
  filterAlerts,
  getAlertStats,
  getZones,
} from "@/features/alerts/lib/alerts"
import type { MissionFiltersValue } from "@/features/alerts/types"
import { formatDate } from "@/lib/format"

const initialFilters: MissionFiltersValue = {
  search: "",
  zone: "",
  sort: "power",
}

export default function TodayPage() {
  const { data, status, refetch } = useAlerts("today")
  const [filters, setFilters] = useState(initialFilters)
  const stats = useMemo(() => getAlertStats(data), [data])
  const missions = useMemo(
    () => data.filter((alert) => alert.vbucks > 0),
    [data]
  )
  const filtered = useMemo(
    () => filterAlerts(missions, filters),
    [missions, filters]
  )
  const latestDate = data.reduce(
    (latest, alert) => (alert.date > latest ? alert.date : latest),
    ""
  )
  const loading = status === "loading"
  const ready = status === "success"

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <title>Alertas de pavos · STW Alerts</title>
      <meta
        name="description"
        content="Encuentra misiones con pavos en Fortnite Save the World. Consulta recompensas, zonas y niveles de la última rotación disponible."
      />
      <div className="flex items-start justify-between gap-3 sm:items-center">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            Alertas de pavos
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
            {latestDate ? (
              <span>
                Rotación del{" "}
                <time dateTime={latestDate}>{formatDate(latestDate)}</time>
              </span>
            ) : (
              "Última rotación registrada"
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="size-9 shrink-0 p-0 sm:h-8 sm:w-auto sm:px-2.5"
          aria-label="Actualizar alertas"
          title="Actualizar alertas"
          onClick={refetch}
          disabled={loading}
        >
          <RefreshCw
            className={loading ? "size-3.5 animate-spin" : "size-3.5"}
            aria-hidden="true"
          />
          <span className="hidden sm:inline">Actualizar</span>
        </Button>
      </div>

      <RewardSummary
        total={ready && data.length ? stats.totalVbucks : null}
        missionCount={ready && data.length ? stats.missions : null}
        zoneCount={ready && data.length ? stats.zones : null}
        minimumPower={ready ? stats.minPower : null}
        loading={loading}
      />

      <section aria-labelledby="missions-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2
              id="missions-heading"
              className="text-base font-semibold tracking-tight"
            >
              Misiones disponibles
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
            Ver historial
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
            title="No pudimos cargar las alertas"
            description="La información no está disponible en este momento. Intenta nuevamente en unos instantes."
          >
            <Button variant="outline" onClick={refetch}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Volver a intentar
            </Button>
          </FeedbackState>
        )}
        {ready && !missions.length && (
          <FeedbackState
            title={
              data.length
                ? "Sin misiones con pavos en esta rotación"
                : "Todavía no hay alertas disponibles"
            }
            description={
              data.length
                ? "No se registraron misiones con pavos en esta rotación. Puedes explorar las recompensas de días anteriores en el historial."
                : "Cuando haya una rotación registrada, encontrarás aquí sus misiones y recompensas."
            }
          >
            <Link
              className={buttonVariants({ variant: "outline" })}
              to="/history"
            >
              Explorar historial
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </FeedbackState>
        )}
        {ready && missions.length > 0 && !filtered.length && (
          <FeedbackState
            title="No encontramos misiones"
            description="Prueba con otra búsqueda o selecciona una zona diferente."
          >
            <Button
              variant="outline"
              onClick={() => setFilters(initialFilters)}
            >
              Limpiar filtros
            </Button>
          </FeedbackState>
        )}
        {ready && filtered.length > 0 && (
          <>
            <p className="sr-only" role="status">
              {filtered.length} misiones encontradas
            </p>
            <MissionList alerts={filtered} />
          </>
        )}
      </section>
    </div>
  )
}
