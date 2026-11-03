import { useMemo } from "react"
import { Cell, Label, Pie, PieChart } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useAlertRewards } from "@/features/alerts/hooks/use-alerts"
import type {
  AlertRewardsResponse,
  RewardPeriod,
} from "@/features/alerts/types"
import { formatDate, formatNumber } from "@/lib/format"
import { analyzeRewardDays, type RewardRun } from "../lib/insights"
import { InsightsState } from "./insights-state"

const config = {
  rewarded: { label: "Days with V-Bucks", color: "var(--primary)" },
  zero: {
    label: "Recorded zero-reward days",
    color: "var(--muted-foreground)",
  },
} satisfies ChartConfig

function runDates(run: RewardRun | null) {
  if (!run) return "No matching days recorded"
  return `${formatDate(run.from)}${run.from === run.to ? "" : ` – ${formatDate(run.to)}`}`
}

function runLength(run: RewardRun | null) {
  return run
    ? `${formatNumber(run.length)} ${run.length === 1 ? "day" : "days"}`
    : "—"
}

function StreakAnalysis({ response }: { response: AlertRewardsResponse }) {
  const stats = useMemo(() => analyzeRewardDays(response), [response])
  const slices = [
    { name: "rewarded", days: stats.rewardDays, fill: "var(--color-rewarded)" },
    { name: "zero", days: stats.zeroDays, fill: "var(--color-zero)" },
  ]
  const percentage = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(stats.rewardRate ?? 0)
  const metrics = [
    {
      label: "Longest run with V-Bucks",
      value: runLength(stats.longestRewards),
      description: runDates(stats.longestRewards),
    },
    {
      label: "Longest run without V-Bucks",
      value: runLength(stats.longestZeros),
      description: runDates(stats.longestZeros),
    },
    {
      label: "Best recorded day",
      value: `${formatNumber(stats.bestDay?.vbucks ?? 0)} V-Bucks`,
      description: stats.bestDay
        ? formatDate(stats.bestDay.date)
        : "No records",
    },
    {
      label: "Latest recorded run",
      value: runLength(stats.latestRun),
      description: stats.latestRun
        ? `${stats.latestRun.kind === "reward" ? "With V-Bucks" : "Without V-Bucks"} · through ${formatDate(stats.latestRun.to)}`
        : "The last day in this period has no records",
    },
  ]

  return (
    <div className="space-y-5">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr] lg:items-center">
        <div>
          <ChartContainer
            config={config}
            className="mx-auto aspect-auto h-64 w-full max-w-sm"
            role="img"
            aria-label={`${percentage}% of recorded days had V-Bucks: ${stats.rewardDays} with rewards and ${stats.zeroDays} with zero rewards.`}
          >
            <PieChart accessibilityLayer>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    nameKey="name"
                    formatter={(value, name) => (
                      <span className="flex justify-between gap-4">
                        <span className="text-muted-foreground">
                          {name === "rewarded"
                            ? "Days with V-Bucks"
                            : "Zero-reward days"}
                        </span>
                        <strong className="tabular-nums">
                          {formatNumber(Number(value))}
                        </strong>
                      </span>
                    )}
                  />
                }
              />
              <Pie
                data={slices}
                dataKey="days"
                nameKey="name"
                innerRadius={70}
                outerRadius={96}
                paddingAngle={stats.rewardDays && stats.zeroDays ? 4 : 0}
                strokeWidth={0}
                isAnimationActive="auto"
              >
                {slices.map((slice) => (
                  <Cell key={slice.name} fill={slice.fill} />
                ))}
                <Label
                  position="center"
                  content={({ viewBox }) => {
                    if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox))
                      return null
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          dy="-5"
                          className="fill-foreground text-3xl font-semibold"
                        >
                          {percentage}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          dy="23"
                          className="fill-muted-foreground text-[10px]"
                        >
                          days with V-Bucks
                        </tspan>
                      </text>
                    )
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />
              {formatNumber(stats.rewardDays)} with V-Bucks
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-2 rounded-full bg-muted-foreground" />
              {formatNumber(stats.zeroDays)} zero-reward days
            </span>
          </div>
        </div>
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {metrics.map((metric) => (
            <dl key={metric.label} className="min-w-0 space-y-2 border-t pt-3">
              <dt className="text-xs text-muted-foreground">{metric.label}</dt>
              <dd className="text-xl font-semibold tracking-tight tabular-nums">
                {metric.value}
              </dd>
              <dd className="text-xs text-muted-foreground">
                {metric.description}
              </dd>
            </dl>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {formatNumber(stats.recordedDays)} / {formatNumber(stats.totalDays)}{" "}
        days recorded · {formatNumber(stats.missingDays)} without records.
        Missing dates interrupt streaks and are excluded from the percentage.
        All runs are limited to this period.
      </p>
      <p className="text-xs text-muted-foreground">
        {formatDate(response.from)} – {formatDate(response.to)}
      </p>
    </div>
  )
}

export function StreakInsights({ period }: { period: RewardPeriod }) {
  const { data, status, refetch } = useAlertRewards(period, "heatmap")
  const hasRecords = data?.data.some((bucket) => bucket.recordedDays > 0)
  if (status !== "success" || !data || !hasRecords)
    return (
      <InsightsState status={status} empty={!hasRecords} onRetry={refetch} />
    )
  return <StreakAnalysis response={data} />
}
