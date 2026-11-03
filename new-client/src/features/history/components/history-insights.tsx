import { lazy, Suspense, useState } from "react"
import { ChartLine, Flame, MapPin } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"
import type { RewardPeriod } from "@/features/alerts/types"
import type { ExploreZone } from "./zone-insights"

const AnnualInsights = lazy(() =>
  import("./annual-insights").then((module) => ({
    default: module.AnnualInsights,
  }))
)
const StreakInsights = lazy(() =>
  import("./streak-insights").then((module) => ({
    default: module.StreakInsights,
  }))
)
const ZoneInsights = lazy(() =>
  import("./zone-insights").then((module) => ({ default: module.ZoneInsights }))
)

const periods: { value: RewardPeriod; label: string; description: string }[] = [
  { value: "7d", label: "7D", description: "Last 7 days" },
  { value: "1m", label: "1M", description: "Last 30 days" },
  { value: "6m", label: "6M", description: "Last 6 months" },
  { value: "1y", label: "1Y", description: "Last year" },
  { value: "all", label: "All time", description: "All recorded history" },
]

export function HistoryInsights({
  refreshKey,
  onExploreZone,
}: {
  refreshKey: number
  onExploreZone: ExploreZone
}) {
  const [view, setView] = useState("annual")
  const [period, setPeriod] = useState<RewardPeriod>("1y")

  return (
    <section
      className="rounded-xl border bg-card p-5 sm:p-6"
      aria-labelledby="insights-heading"
    >
      <div className="mb-5">
        <h2 id="insights-heading" className="font-semibold tracking-tight">
          Insights
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Compare years, explore reward streaks and find each zone's
          contribution.
        </p>
      </div>
      <Tabs
        value={view}
        onValueChange={(value) => {
          if (typeof value === "string") setView(value)
        }}
        className="gap-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList
            aria-label="History analysis"
            className="grid w-full grid-cols-3 sm:w-auto"
          >
            <TabsTrigger
              value="annual"
              className="min-w-0 text-[11px] leading-tight whitespace-normal sm:text-sm"
            >
              <ChartLine
                className="hidden size-3.5 sm:block"
                aria-hidden="true"
              />
              Compare years
            </TabsTrigger>
            <TabsTrigger
              value="streaks"
              className="min-w-0 text-[11px] leading-tight whitespace-normal sm:text-sm"
            >
              <Flame className="hidden size-3.5 sm:block" aria-hidden="true" />
              Days & streaks
            </TabsTrigger>
            <TabsTrigger
              value="zones"
              className="min-w-0 text-[11px] leading-tight whitespace-normal sm:text-sm"
            >
              <MapPin className="hidden size-3.5 sm:block" aria-hidden="true" />
              Zones
            </TabsTrigger>
          </TabsList>
          {view === "annual" ? (
            <span className="text-xs text-muted-foreground">
              All recorded years
            </span>
          ) : (
            <ToggleGroup
              value={[period]}
              onValueChange={(values) => {
                const selected = periods.find(
                  (item) => item.value === values[0]
                )
                if (selected) setPeriod(selected.value)
              }}
              aria-label="Insights period"
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
                  className="min-w-10 data-pressed:bg-primary data-pressed:text-primary-foreground"
                >
                  {item.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        </div>
        <Suspense
          fallback={
            <Skeleton className="h-96 w-full" aria-label="Loading analysis" />
          }
        >
          <TabsContent value="annual" className="min-h-96">
            {view === "annual" && <AnnualInsights key={refreshKey} />}
          </TabsContent>
          <TabsContent value="streaks" className="min-h-96">
            {view === "streaks" && (
              <StreakInsights key={refreshKey} period={period} />
            )}
          </TabsContent>
          <TabsContent value="zones" className="min-h-96">
            {view === "zones" && (
              <ZoneInsights
                key={refreshKey}
                period={period}
                onExplore={onExploreZone}
              />
            )}
          </TabsContent>
        </Suspense>
      </Tabs>
    </section>
  )
}
