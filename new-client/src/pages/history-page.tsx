import { useMemo } from "react"
import { CalendarDays, Coins, Crosshair, RefreshCw } from "lucide-react"
import { useSearchParams } from "react-router"
import { Button } from "@/components/ui/button"
import { FeedbackState } from "@/components/shared/feedback-state"
import { PageHeading } from "@/components/shared/page-heading"
import { StatCard } from "@/components/shared/stat-card"
import { AlertsSkeleton } from "@/features/alerts/components/alerts-skeleton"
import { useAlerts } from "@/features/alerts/hooks/use-alerts"
import {
  filterAlerts,
  getAlertStats,
  getDailyRewards,
  getZones,
} from "@/features/alerts/lib/alerts"
import {
  HistoryFilters,
  type HistoryFiltersValue,
} from "@/features/history/components/history-filters"
import {
  HISTORY_PAGE_SIZE,
  HistoryTable,
} from "@/features/history/components/history-table"
import { RewardChart } from "@/features/history/components/reward-chart"
import { formatNumber } from "@/lib/format"

export default function HistoryPage() {
  const { data, status, refetch } = useAlerts("history")
  const [params, setParams] = useSearchParams()
  const search = params.get("q") ?? ""
  const zone = params.get("zone") ?? ""
  const sortParam = params.get("sort")
  const sort =
    sortParam === "power" || sortParam === "reward" ? sortParam : "recent"
  const from = params.get("from") ?? ""
  const to = params.get("to") ?? ""
  const invalidRange = Boolean(from && to && from > to)
  const filtered = useMemo(
    () => filterAlerts(data, { search, zone, sort }, from, to),
    [data, search, zone, sort, from, to]
  )
  const stats = useMemo(() => getAlertStats(filtered), [filtered])
  const days = useMemo(() => getDailyRewards(filtered), [filtered])
  const pageParam = Number(params.get("page"))
  const page = Math.min(
    Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1,
    Math.max(1, Math.ceil(filtered.length / HISTORY_PAGE_SIZE))
  )
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
      <title>Historial de pavos · STW Alerts</title>
      <meta
        name="description"
        content="Explora el historial de misiones con pavos en Save the World. Filtra por fecha y zona y consulta las recompensas registradas."
      />
      <PageHeading
        eyebrow="Cada rotación deja su huella"
        title={
          <>
            Cada rotación, <span className="text-primary">en perspectiva.</span>
          </>
        }
        description="Consulta las misiones anteriores y sus recompensas. Filtra por fecha o zona para explorar el historial."
      >
        <Button variant="outline" onClick={refetch} disabled={loading}>
          <RefreshCw
            className={loading ? "size-4 animate-spin" : "size-4"}
            aria-hidden="true"
          />
          Actualizar
        </Button>
      </PageHeading>

      <HistoryFilters
        key={JSON.stringify([search, zone, sort, from, to])}
        value={{ search, zone, sort, from, to }}
        zones={getZones(data)}
        disabled={!ready}
        loading={loading}
        resultCount={filtered.length}
        onApply={updateFilters}
        onClear={() => setParams({}, { replace: true })}
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard
          label="Pavos registrados"
          value={ready ? formatNumber(stats.totalVbucks) : "—"}
          description="Recompensas de la selección actual"
          icon={Coins}
          loading={loading}
        />
        <StatCard
          label="Misiones con pavos"
          value={ready ? formatNumber(stats.missions) : "—"}
          description="Sin contar los días sin recompensas"
          icon={Crosshair}
          loading={loading}
        />
        <StatCard
          label="Días registrados"
          value={ready ? formatNumber(stats.days) : "—"}
          description="Fechas disponibles en esta selección"
          icon={CalendarDays}
          loading={loading}
        />
      </div>

      {loading && <AlertsSkeleton />}
      {status === "error" && (
        <FeedbackState
          error
          title="No pudimos cargar el historial"
          description="Los registros no están disponibles en este momento. Intenta nuevamente en unos instantes."
        >
          <Button variant="outline" onClick={refetch}>
            Volver a intentar
          </Button>
        </FeedbackState>
      )}
      {ready && !invalidRange && filtered.length === 0 && (
        <FeedbackState
          title={
            data.length
              ? "No hay registros con estos filtros"
              : "El historial aún está por escribirse"
          }
          description={
            data.length
              ? "Prueba con otras fechas, una zona diferente o una búsqueda más amplia."
              : "Las alertas aparecerán aquí a medida que se registren nuevas rotaciones."
          }
        >
          {hasFilters && (
            <Button
              variant="outline"
              onClick={() => setParams({}, { replace: true })}
            >
              Limpiar filtros
            </Button>
          )}
        </FeedbackState>
      )}
      {ready && !invalidRange && filtered.length > 0 && (
        <>
          <RewardChart days={days} />
          <section aria-labelledby="history-heading" className="space-y-4">
            <div>
              <h2
                id="history-heading"
                className="text-xl font-semibold tracking-tight"
              >
                Todas las alertas
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Las fechas sin misiones con pavos se conservan como registros de
                cero recompensas.
              </p>
            </div>
            <HistoryTable
              alerts={filtered}
              page={page}
              onPageChange={(next) =>
                updateParams({ page: String(next) }, false)
              }
            />
          </section>
        </>
      )}
    </div>
  )
}
