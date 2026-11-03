import { useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useAlertZones } from "@/features/alerts/hooks/use-alerts"
import type { AlertZonesResponse, RewardPeriod } from "@/features/alerts/types"
import { formatDate, formatNumber } from "@/lib/format"
import { InsightsState } from "./insights-state"

export type ExploreZone = (zone: string, from: string, to: string) => void

const config = {
  vbucks: { label: "V-Bucks", color: "var(--primary)" },
  missions: { label: "Missions", theme: { light: "#2563eb", dark: "#93c5fd" } },
} satisfies ChartConfig

function ZoneRanking({
  response,
  onExplore,
}: {
  response: AlertZonesResponse
  onExplore: ExploreZone
}) {
  const [metric, setMetric] = useState<"vbucks" | "missions">("vbucks")
  const data = [...response.data].sort(
    (a, b) => b[metric] - a[metric] || a.zone.localeCompare(b.zone)
  )
  const total = data.reduce((sum, zone) => sum + zone[metric], 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          All recorded missions in this period · {formatNumber(total)}{" "}
          {metric === "vbucks" ? "V-Bucks" : "missions"}
        </p>
        <ToggleGroup
          value={[metric]}
          onValueChange={(values) => {
            if (values[0] === "vbucks" || values[0] === "missions")
              setMetric(values[0])
          }}
          aria-label="Zone ranking metric"
          variant="outline"
          size="sm"
          spacing={0}
        >
          <ToggleGroupItem
            value="vbucks"
            className="data-pressed:bg-primary data-pressed:text-primary-foreground"
          >
            V-Bucks
          </ToggleGroupItem>
          <ToggleGroupItem
            value="missions"
            className="data-pressed:bg-primary data-pressed:text-primary-foreground"
          >
            Missions
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      {data.length ? (
        <>
          <ChartContainer
            config={config}
            className="aspect-auto w-full"
            style={{ height: Math.max(240, data.length * 48 + 30) }}
            role="img"
            aria-label={`Zone ranking by ${metric}: ${data.map((zone) => `${zone.zone}, ${formatNumber(zone[metric])}`).join("; ")}`}
          >
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 0, right: 12, top: 4, bottom: 0 }}
              accessibilityLayer
            >
              <CartesianGrid
                horizontal={false}
                stroke="var(--border)"
                strokeDasharray="3 4"
              />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                tickFormatter={(value: number) => formatNumber(value)}
              />
              <YAxis
                type="category"
                dataKey="zone"
                width={105}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_label, payload) =>
                      payload?.[0]?.payload?.zone ?? "Zone"
                    }
                    formatter={(value) => (
                      <span className="flex justify-between gap-4">
                        <span className="text-muted-foreground">
                          {metric === "vbucks" ? "V-Bucks" : "Missions"}
                        </span>
                        <strong className="tabular-nums">
                          {formatNumber(Number(value))}
                        </strong>
                      </span>
                    )}
                  />
                }
              />
              <Bar
                dataKey={metric}
                fill={`var(--color-${metric})`}
                radius={[0, 4, 4, 0]}
                maxBarSize={28}
                isAnimationActive="auto"
                onClick={(entry) => {
                  const zone = entry.payload?.zone
                  if (typeof zone === "string")
                    onExplore(zone, response.from, response.to)
                }}
                className="cursor-pointer"
              />
            </BarChart>
          </ChartContainer>
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Explore zone missions"
          >
            <span className="mr-1 text-xs text-muted-foreground">
              Explore missions:
            </span>
            {data.map((zone) => (
              <Button
                key={zone.zone}
                variant="outline"
                size="sm"
                onClick={() => onExplore(zone.zone, response.from, response.to)}
              >
                {zone.zone}
              </Button>
            ))}
          </div>
        </>
      ) : (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          No V-Buck missions recorded in this period.
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {formatNumber(response.recordedDays)} /{" "}
        {formatNumber(response.totalDays)} days recorded.{" "}
        {response.recordedDays < response.totalDays
          ? "Partial period: totals only include recorded rewards."
          : "Complete recording coverage for this period."}
      </p>
      <p className="text-xs text-muted-foreground">
        {formatDate(response.from)} – {formatDate(response.to)}
      </p>
    </div>
  )
}

export function ZoneInsights({
  period,
  onExplore,
}: {
  period: RewardPeriod
  onExplore: ExploreZone
}) {
  const { data, status, refetch } = useAlertZones(period)
  if (status !== "success" || !data || data.recordedDays === 0)
    return (
      <InsightsState
        status={status}
        empty={data?.recordedDays === 0}
        onRetry={refetch}
      />
    )
  return <ZoneRanking response={data} onExplore={onExplore} />
}
