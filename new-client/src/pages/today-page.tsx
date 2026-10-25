import { useMemo, useState } from "react"
import { ArrowRight, Crosshair, Info, Map, RefreshCw, Zap } from "lucide-react"
import { Link } from "react-router"
import { Button, buttonVariants } from "@/components/ui/button"
import { FeedbackState } from "@/components/shared/feedback-state"
import { PageHeading } from "@/components/shared/page-heading"
import { StatCard } from "@/components/shared/stat-card"
import { AlertsSkeleton } from "@/features/alerts/components/alerts-skeleton"
import { MissionCard } from "@/features/alerts/components/mission-card"
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
    <div className="space-y-9">
      <title>Alertas de pavos · STW Alerts</title>
      <meta
        name="description"
        content="Encuentra misiones con pavos en Fortnite Save the World. Consulta recompensas, zonas y niveles de la última rotación disponible."
      />
      <section
        className="grid items-center gap-8 pb-1 lg:grid-cols-[1.45fr_1fr] lg:gap-16"
        aria-label="Resumen de la rotación"
      >
        <PageHeading
          eyebrow="Tu radar de Save the World"
          title={
            <>
              Cada misión cuenta.
              <br />
              <span className="text-primary">Cada pavo, también.</span>
            </>
          }
          description="Encuentra las misiones que valen la pena. Todas las alertas de pavos, en un solo lugar."
        />
        <RewardSummary
          total={ready && data.length ? stats.totalVbucks : null}
          date={latestDate || undefined}
          loading={loading}
        />
      </section>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard
          label="Misiones con pavos"
          value={ready ? stats.missions : "—"}
          description="Para completar en esta rotación"
          icon={Crosshair}
          loading={loading}
        />
        <StatCard
          label="Zonas activas"
          value={ready ? stats.zones : "—"}
          description="Regiones con recompensas disponibles"
          icon={Map}
          loading={loading}
        />
        <StatCard
          label="Nivel mínimo"
          value={ready ? (stats.minPower ?? "—") : "—"}
          description="Poder recomendado para empezar"
          icon={Zap}
          loading={loading}
        />
      </div>

      <section aria-labelledby="missions-heading" className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2
              id="missions-heading"
              className="text-xl font-semibold tracking-tight"
            >
              Misiones disponibles
            </h2>
            {ready && (
              <span className="flex size-6 items-center justify-center rounded-md border bg-card text-xs font-medium tabular-nums">
                {missions.length}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw
              className={loading ? "size-3.5 animate-spin" : "size-3.5"}
              aria-hidden="true"
            />
            Actualizar
          </Button>
        </div>
        {ready && latestDate && (
          <p className="-mt-2 text-xs text-muted-foreground">
            Última fecha registrada:{" "}
            <time dateTime={latestDate}>{formatDate(latestDate)}</time>. Las
            alertas corresponden a esa rotación.
          </p>
        )}
        <MissionFilters
          value={filters}
          onChange={setFilters}
          zones={getZones(missions)}
          disabled={!ready}
        />

        {loading && <AlertsSkeleton />}
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
                ? "Esta rotación viene sin pavos"
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((alert) => (
                <MissionCard key={alert.id} alert={alert} />
              ))}
            </div>
          </>
        )}
      </section>

      <aside className="flex flex-col justify-between gap-5 rounded-xl border bg-card px-5 py-5 sm:flex-row sm:items-center sm:px-6">
        <div className="flex gap-3">
          <Info
            className="mt-0.5 size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-medium">
              Un vistazo al pasado también ayuda.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Explora las rotaciones anteriores y descubre cuántos pavos se han
              registrado.
            </p>
          </div>
        </div>
        <Link
          to="/history"
          className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          Ver historial
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </aside>
    </div>
  )
}
