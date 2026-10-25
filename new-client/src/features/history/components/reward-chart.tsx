import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatDate, formatNumber } from "@/lib/format"
import type { DailyReward } from "@/features/alerts/types"

export function RewardChart({ days }: { days: DailyReward[] }) {
  const visibleDays = days.slice(-30)
  return (
    <section
      className="rounded-xl border bg-card p-5 sm:p-6"
      aria-labelledby="chart-heading"
    >
      <div className="mb-7">
        <h2 id="chart-heading" className="font-semibold tracking-tight">
          Los pavos, día a día
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Últimos {visibleDays.length} días registrados de tu selección.
        </p>
      </div>
      <div
        className="h-56 w-full min-w-0"
        role="img"
        aria-label={`Gráfico de recompensas: ${visibleDays.map((day) => `${formatDate(day.date)}: ${day.vbucks} pavos`).join("; ")}`}
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 300, height: 224 }}
        >
          <BarChart
            data={visibleDays}
            margin={{ top: 5, right: 0, left: -24, bottom: 0 }}
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
                formatDate(date, { day: "2-digit", month: "2-digit" })
              }
              axisLine={false}
              tickLine={false}
              minTickGap={30}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              contentStyle={{
                border: "1px solid var(--border)",
                borderRadius: "8px",
                background: "var(--popover)",
                color: "var(--popover-foreground)",
                fontSize: "12px",
              }}
              labelFormatter={(date) => formatDate(String(date))}
              formatter={(value) => [
                `${formatNumber(Number(value))} pavos`,
                "Recompensa",
              ]}
            />
            <Bar
              dataKey="vbucks"
              fill="var(--primary)"
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
