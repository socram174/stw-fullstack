import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { HISTORY_PAGE_SIZE } from "./history-table"

export function HistoryTableSkeleton({
  rows = HISTORY_PAGE_SIZE,
  overlay = false,
}: {
  rows?: number
  overlay?: boolean
}) {
  return (
    <div
      role="status"
      aria-label="Loading mission history"
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border bg-card",
        overlay && "absolute inset-0"
      )}
    >
      <span className="sr-only">Loading mission history…</span>
      <div aria-hidden="true" className="flex min-h-0 flex-1 flex-col">
        <div className="grid h-10 shrink-0 grid-cols-[1fr_2fr_1fr_0.75fr_0.75fr] items-center gap-4 border-b bg-muted/40 px-5">
          {["w-12", "w-16", "w-12", "w-10", "ml-auto w-14"].map(
            (width, index) => (
              <Skeleton key={index} className={cn("h-4 max-w-full", width)} />
            )
          )}
        </div>
        <div className="flex min-h-0 flex-1 flex-col divide-y">
          {Array.from({ length: rows }, (_, index) => (
            <div
              key={index}
              className={cn(
                "grid grid-cols-[1fr_2fr_1fr_0.75fr_0.75fr] items-center gap-4 px-5",
                overlay ? "min-h-0 flex-1" : "h-14"
              )}
            >
              <Skeleton className="h-4 w-24 max-w-full" />
              <Skeleton className="h-4 w-48 max-w-full" />
              <Skeleton className="h-5 w-24 max-w-full rounded-full" />
              <Skeleton className="h-4 w-12 max-w-full" />
              <Skeleton className="ml-auto h-4 w-10 max-w-full" />
            </div>
          ))}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-5 py-4">
          <Skeleton className="h-4 w-36" />
          <div className="flex items-center gap-2">
            <Skeleton className="size-8" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="size-8" />
          </div>
        </div>
      </div>
    </div>
  )
}
