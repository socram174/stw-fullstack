import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ZoneBadge } from "@/features/alerts/components/zone-badge"
import type { MissionAlert } from "@/features/alerts/types"
import { formatDate, formatNumber } from "@/lib/format"

export const HISTORY_PAGE_SIZE = 15

export function HistoryTable({
  alerts,
  page,
  onPageChange,
}: {
  alerts: MissionAlert[]
  page: number
  onPageChange: (page: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(alerts.length / HISTORY_PAGE_SIZE))
  const start = (page - 1) * HISTORY_PAGE_SIZE
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Table>
        <TableCaption className="sr-only">
          Alert history. Page {page} of {totalPages}. Rewards and power levels
          for each mission.
        </TableCaption>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead scope="col" className="pl-5">
              Date
            </TableHead>
            <TableHead scope="col">Mission</TableHead>
            <TableHead scope="col">Zone</TableHead>
            <TableHead scope="col">Level</TableHead>
            <TableHead scope="col" className="pr-5 text-right">
              V-Bucks
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.slice(start, start + HISTORY_PAGE_SIZE).map((alert) => (
            <TableRow key={alert.id}>
              <TableCell className="py-4 pl-5 text-muted-foreground">
                <time dateTime={alert.date}>
                  {formatDate(alert.date, {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              </TableCell>
              <TableCell className="min-w-48 whitespace-normal">
                <span className="font-medium">{alert.mission}</span>
                {alert.afterReset && (
                  <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <RotateCcw className="size-3" aria-hidden="true" />
                    After reset
                  </span>
                )}
              </TableCell>
              <TableCell>
                {alert.vbucks > 0 ? (
                  <ZoneBadge zone={alert.zone} />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums">
                {alert.vbucks > 0 && alert.powerLevel > 0
                  ? `${alert.powerLevel} PL`
                  : "—"}
              </TableCell>
              <TableCell className="pr-5 text-right font-semibold text-primary tabular-nums">
                {alert.vbucks > 0 ? "+" : ""}
                {formatNumber(alert.vbucks)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4">
        <p className="text-xs text-muted-foreground">
          {formatNumber(start + 1)}–
          {formatNumber(Math.min(start + HISTORY_PAGE_SIZE, alerts.length))} of{" "}
          {formatNumber(alerts.length)}{" "}
          {alerts.length === 1 ? "record" : "records"}
        </p>
        <nav
          aria-label="History pagination"
          className="flex items-center gap-2"
        >
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <span
            className="px-1 text-xs text-muted-foreground"
            aria-live="polite"
          >
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </nav>
      </div>
    </div>
  )
}
