import { useMemo, useState } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useAlertRewards } from "@/features/alerts/hooks/use-alerts"
import type { AlertRewardsResponse } from "@/features/alerts/types"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { buildAnnualComparison } from "../lib/insights"
import { InsightsState } from "./insights-state"

const palette = [
  { light: "#15803d", dark: "#4ade80" },
  { light: "#2563eb", dark: "#93c5fd" },
  { light: "#7c3aed", dark: "#c4b5fd" },
  { light: "#be185d", dark: "#f9a8d4" },
  { light: "#0e7490", dark: "#67e8f9" },
]
const averageFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
})

function AnnualComparison({ response }: { response: AlertRewardsResponse }) {
  const comparison = useMemo(() => buildAnnualComparison(response), [response])
  const [selected, setSelected] = useState(() => comparison.years.slice(0, 3))
  const [metric, setMetric] = useState<"total" | "average">("total")
  const config: ChartConfig = Object.fromEntries(
    comparison.years.map((year, index) => [
      `year${year}`,
      { label: String(year), theme: palette[index % palette.length] },
    ])
  )
  const rows = comparison.months.map(({ month, values }) => ({
    month,
    ...Object.fromEntries(
      comparison.years.map((year) => {
        const item = values[year]
        return [
          `year${year}`,
          item.vbucks === null
            ? null
            : metric === "total"
              ? item.vbucks
              : item.vbucks / item.recordedDays,
        ]
      })
    ),
  }))

  function toggleYear(year: number) {
    setSelected((previous) =>
      previous.includes(year)
        ? previous.length === 1
          ? previous
          : previous.filter((item) => item !== year)
        : [...previous, year]
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Years to compare"
        >
          {comparison.years.map((year, index) => (
            <Button
              key={year}
              variant="outline"
              size="sm"
              aria-pressed={selected.includes(year)}
              onClick={() => toggleYear(year)}
              className={cn(
                "gap-2 tabular-nums",
                !selected.includes(year) && "opacity-50"
              )}
            >
              <span
                className="h-0.5 w-4 rounded-full"
                style={{
                  background: selected.includes(year)
                    ? `light-dark(${palette[index % palette.length].light}, ${palette[index % palette.length].dark})`
                    : "var(--muted-foreground)",
                }}
              />
              {year}
            </Button>
          ))}
        </div>
        <ToggleGroup
          value={[metric]}
          onValueChange={(values) => {
            if (values[0] === "total" || values[0] === "average")
              setMetric(values[0])
          }}
          aria-label="Annual comparison metric"
          variant="outline"
          size="sm"
          spacing={0}
        >
          <ToggleGroupItem
            value="total"
            className="data-pressed:bg-primary data-pressed:text-primary-foreground"
          >
            Monthly total
          </ToggleGroupItem>
          <ToggleGroupItem
            value="average"
            className="data-pressed:bg-primary data-pressed:text-primary-foreground"
          >
            Per recorded day
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <p className="text-xs text-muted-foreground">
        Compare the same calendar months across years.{" "}
        {metric === "total"
          ? "Totals include only recorded rewards."
          : "Averages include recorded zero-reward days."}
      </p>
      <ChartContainer
        config={config}
        className="aspect-auto h-72 w-full"
        role="img"
        aria-label={`${metric === "total" ? "Monthly recorded V-Bucks" : "V-Bucks per recorded day"} by year: ${selected.join(", ")}. Incomplete months are outlined in amber.`}
      >
        <LineChart
          data={rows}
          margin={{ top: 12, right: 12, bottom: 0, left: 0 }}
          accessibilityLayer
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="3 4"
          />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            minTickGap={12}
            tick={{ fontSize: 11 }}
            padding={{ left: 8, right: 8 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={54}
            allowDecimals={metric === "average"}
            tickFormatter={(value: number) => averageFormatter.format(value)}
            domain={[0, (maximum: number) => Math.max(1, maximum)]}
            tick={{ fontSize: 11 }}
          />
          <ChartTooltip
            filterNull={false}
            content={({ active, label }) => {
              const month = comparison.months.find(
                (item) => item.month === label
              )
              if (!active || !month) return null
              return (
                <div className="max-w-72 space-y-2 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
                  <p className="font-medium">{month.month}</p>
                  {selected.map((year) => {
                    const item = month.values[year]
                    return (
                      <div key={year} className="space-y-0.5">
                        <p className="flex justify-between gap-4">
                          <span style={{ color: `var(--color-year${year})` }}>
                            {year}
                          </span>
                          <span
                            className={cn(
                              "font-semibold tabular-nums",
                              item.partial &&
                                item.vbucks !== null &&
                                "text-chart-partial"
                            )}
                          >
                            {item.vbucks === null
                              ? item.inRange
                                ? "No records"
                                : "Outside recorded range"
                              : `${metric === "total" ? formatNumber(item.vbucks) : averageFormatter.format(item.vbucks / item.recordedDays)} ${metric === "total" ? "V-Bucks" : "V-Bucks / day"}`}
                          </span>
                        </p>
                        {item.inRange && (
                          <p className="text-muted-foreground">
                            {item.recordedDays} / {item.calendarDays} calendar
                            days recorded
                            {item.partial && item.vbucks !== null
                              ? " · Partial month"
                              : ""}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            }}
          />
          {selected.map((year, index) => (
            <Line
              key={year}
              dataKey={`year${year}`}
              type="linear"
              stroke={`var(--color-year${year})`}
              strokeWidth={2}
              strokeDasharray={index % 2 ? "6 4" : undefined}
              dot={{ r: 2, fill: `var(--color-year${year})`, strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              connectNulls={false}
              isAnimationActive="auto"
            />
          ))}
          {comparison.months.flatMap((month) =>
            selected
              .filter(
                (year) =>
                  month.values[year].partial &&
                  month.values[year].vbucks !== null
              )
              .map((year) => (
                <ReferenceDot
                  key={`${year}-${month.month}`}
                  x={month.month}
                  y={
                    metric === "total"
                      ? month.values[year].vbucks!
                      : month.values[year].vbucks! /
                        month.values[year].recordedDays
                  }
                  r={4}
                  fill="var(--card)"
                  stroke="var(--chart-partial)"
                  strokeWidth={2}
                />
              ))
          )}
        </LineChart>
      </ChartContainer>
      <p className="text-xs text-muted-foreground">
        Amber outlines mark incomplete calendar months. Months without records
        remain gaps.
      </p>
    </div>
  )
}

export function AnnualInsights() {
  const { data, status, refetch } = useAlertRewards("all")
  const hasRecords = data?.data.some((bucket) => bucket.recordedDays > 0)
  if (status !== "success" || !data || !hasRecords)
    return (
      <InsightsState status={status} empty={!hasRecords} onRetry={refetch} />
    )
  return <AnnualComparison key={`${data.from}:${data.to}`} response={data} />
}
