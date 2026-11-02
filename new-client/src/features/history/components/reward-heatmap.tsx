import { Tooltip } from "@base-ui/react/tooltip"
import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react"
import type {
  AlertRewardsResponse,
  RewardBucket,
} from "@/features/alerts/types"
import { formatDate, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  buildRewardCalendar,
  rewardIntensity,
  shiftCalendarDate,
  type RewardCalendarYear,
} from "../lib/reward-calendar"
import { RewardTooltip } from "./reward-tooltip"

const levels = [
  "bg-muted",
  "bg-heatmap-1",
  "bg-heatmap-2",
  "bg-heatmap-3",
  "bg-heatmap-4",
]
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const scaleLabels = ["0", "1–50", "51–100", "101–150", "151+"]

function cellColor(value: number | null) {
  const level = rewardIntensity(value)
  return level === null ? "heatmap-missing bg-card" : levels[level]
}

function CalendarYear({
  calendar,
  tooltip,
  scaleColumns,
}: {
  calendar: RewardCalendarYear
  tooltip: Tooltip.Handle<RewardBucket>
  scaleColumns: number
}) {
  const [focusedDate, setFocusedDate] = useState(calendar.to)
  const grid = useRef<HTMLDivElement>(null)
  const columns = {
    gridTemplateColumns: `40px repeat(${calendar.weeks.length}, var(--heatmap-cell-size))`,
  }

  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target
    if (!(target instanceof HTMLButtonElement) || !target.dataset.date) return
    const steps: Record<string, number> = {
      ArrowLeft: -7,
      ArrowRight: 7,
      ArrowUp: -1,
      ArrowDown: 1,
    }
    const step = steps[event.key]
    if (step === undefined) return
    event.preventDefault()
    const next = shiftCalendarDate(target.dataset.date, step)
    if (next < calendar.from || next > calendar.to) return
    grid.current
      ?.querySelector<HTMLButtonElement>(`button[data-date="${next}"]`)
      ?.focus()
  }

  return (
    <section
      className="space-y-3"
      aria-label={`${calendar.year} daily rewards`}
      style={
        {
          "--heatmap-cell-size": `clamp(16px, calc((100cqw - 40px - ${scaleColumns} * 4px) / ${scaleColumns}), 32px)`,
        } as CSSProperties
      }
    >
      <h3 className="text-sm font-medium tabular-nums">{calendar.year}</h3>
      <div className="-m-1 overflow-x-auto p-1 pb-3">
        <div className="w-max">
          <div
            className="mb-2 grid h-5 gap-1 text-xs text-muted-foreground"
            style={columns}
            aria-hidden="true"
          >
            {calendar.months.map((month) => (
              <span
                key={month.column}
                className="whitespace-nowrap"
                style={{
                  gridColumn: month.column + 2,
                  justifySelf:
                    month.column === calendar.weeks.length - 1
                      ? "end"
                      : undefined,
                }}
              >
                {month.label}
              </span>
            ))}
          </div>
          <div
            ref={grid}
            role="grid"
            aria-label={`${calendar.year} V-Buck rewards. Use arrow keys to explore days.`}
            onKeyDown={navigate}
            className="space-y-1"
          >
            {weekdays.map((weekday, row) => (
              <div
                key={weekday}
                role="row"
                className="grid items-center gap-1"
                style={columns}
              >
                <span
                  role="rowheader"
                  className="text-xs text-muted-foreground"
                >
                  {weekday}
                </span>
                {calendar.weeks.map((week, column) => {
                  const day = week[row]
                  return (
                    <span
                      key={column}
                      role="gridcell"
                      aria-disabled={!day || undefined}
                    >
                      {day ? (
                        <Tooltip.Trigger
                          handle={tooltip}
                          payload={day}
                          type="button"
                          data-date={day.date}
                          tabIndex={focusedDate === day.date ? 0 : -1}
                          onFocus={() => setFocusedDate(day.date)}
                          aria-label={`${formatDate(day.date)}: ${day.vbucks === null ? "No records" : `${formatNumber(day.vbucks)} V-Bucks, ${formatNumber(day.missions)} missions`}`}
                          className={cn(
                            "block aspect-square w-full rounded-sm border border-foreground/10 p-0 transition-[box-shadow] outline-none hover:ring-2 hover:ring-foreground/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card",
                            cellColor(day.vbucks)
                          )}
                        />
                      ) : (
                        <span
                          className="block aspect-square w-full"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function RewardHeatmap({
  response,
}: {
  response: AlertRewardsResponse
}) {
  const calendars = useMemo(() => buildRewardCalendar(response), [response])
  const scaleColumns = Math.max(
    1,
    ...calendars.map((year) => year.weeks.length)
  )
  const [tooltip] = useState(() => Tooltip.createHandle<RewardBucket>())

  return (
    <Tooltip.Provider delay={0}>
      <div className="[container-type:inline-size] min-h-56 space-y-6">
        {calendars.map((calendar) => (
          <CalendarYear
            key={`${calendar.from}:${calendar.to}`}
            calendar={calendar}
            tooltip={tooltip}
            scaleColumns={scaleColumns}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-5 gap-y-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="heatmap-missing size-3 rounded-[3px] border bg-card" />
          No records
        </span>
        <div
          className="flex flex-wrap items-center gap-3"
          aria-label="Daily V-Buck color scale"
        >
          {scaleLabels.map((label, index) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              <span
                className={cn(
                  "size-3 rounded-[3px] border border-foreground/10",
                  levels[index]
                )}
              />
              {label}
            </span>
          ))}
          <span>V-Bucks / day</span>
        </div>
      </div>
      <Tooltip.Root handle={tooltip}>
        {({ payload }) =>
          payload && (
            <Tooltip.Portal>
              <Tooltip.Positioner side="top" sideOffset={8} className="z-50">
                <Tooltip.Popup className="outline-none">
                  <RewardTooltip bucket={payload} />
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          )
        }
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
