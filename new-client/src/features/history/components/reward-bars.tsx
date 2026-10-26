import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatDate, formatNumber } from "@/lib/format"
import type { AlertRewardsResponse } from "@/features/alerts/types"

export function RewardBars({ response }: { response: AlertRewardsResponse }) {
  const { data, interval } = response
  const hasMissing = data.some((bucket) => bucket.recordedDays === 0)
  const hasPartial = data.some(
    (bucket) =>
      bucket.recordedDays > 0 && bucket.recordedDays < bucket.totalDays
  )
  const monthOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    year: "2-digit",
  }
  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  }

  return (
    <>
      <div
        className="h-56 w-full min-w-0"
        role="img"
        aria-label={`${interval === "day" ? "Daily" : interval === "week" ? "Weekly" : "Monthly"} V-Buck rewards. ${data.map((bucket) => `${bucket.date} to ${bucket.endDate}: ${bucket.vbucks === null ? "no records" : `${bucket.vbucks} V-Bucks`}, ${bucket.recordedDays} of ${bucket.totalDays} days recorded`).join("; ")}`}
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 300, height: 224 }}
        >
          <BarChart
            data={data}
            margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
            accessibilityLayer
          >
            <CartesianGrid
              stroke="var(--border)"
              vertical={false}
              strokeDasharray="3 4"
            />
            <XAxis
              dataKey="date"
              tickFormatter={(date: string) =>
                formatDate(
                  date,
                  interval === "month" ? monthOptions : dateOptions
                )
              }
              axisLine={false}
              tickLine={false}
              minTickGap={24}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              domain={[0, (maximum: number) => Math.max(50, maximum)]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <Tooltip
              filterNull={false}
              cursor={{ fill: "var(--muted)" }}
              content={({ active, label }) => {
                const bucket = data.find((item) => item.date === label)
                if (!active || !bucket) return null
                return (
                  <div className="space-y-1.5 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
                    <p className="font-medium">
                      {formatDate(bucket.date)}
                      {bucket.date !== bucket.endDate &&
                        ` – ${formatDate(bucket.endDate)}`}
                    </p>
                    <p>
                      {bucket.vbucks === null
                        ? "No records available"
                        : `${formatNumber(bucket.vbucks)} V-Bucks · ${formatNumber(bucket.missions)} missions`}
                    </p>
                    {bucket.recordedDays < bucket.totalDays && (
                      <p className="text-muted-foreground">
                        {bucket.recordedDays} of {bucket.totalDays} days
                        recorded
                        {bucket.recordedDays > 0 ? " · Partial total" : ""}
                      </p>
                    )}
                  </div>
                )
              }}
            />
            <Bar
              dataKey="vbucks"
              fill="var(--primary)"
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
              isAnimationActive="auto"
            >
              {data.map((bucket) => (
                <Cell
                  key={bucket.date}
                  fill={
                    bucket.recordedDays < bucket.totalDays
                      ? "var(--chart-3)"
                      : "var(--primary)"
                  }
                />
              ))}
            </Bar>
            {data
              .filter((bucket) => bucket.vbucks === null || bucket.vbucks === 0)
              .map((bucket) => (
                <ReferenceDot
                  key={bucket.date}
                  x={bucket.date}
                  y={0}
                  r={3}
                  fill={
                    bucket.vbucks === null
                      ? "var(--card)"
                      : bucket.recordedDays < bucket.totalDays
                        ? "var(--chart-3)"
                        : "var(--primary)"
                  }
                  stroke={
                    bucket.vbucks === null
                      ? "var(--muted-foreground)"
                      : bucket.recordedDays < bucket.totalDays
                        ? "var(--chart-3)"
                        : "var(--primary)"
                  }
                />
              ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary" />
          Recorded rewards
        </span>
        {hasPartial && (
          <span className="inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-chart-3" />
            Partial total
          </span>
        )}
        {hasMissing && (
          <span className="inline-flex items-center gap-2">
            <span className="size-2 rounded-full border border-muted-foreground" />
            No records
          </span>
        )}
      </div>
    </>
  )
}
