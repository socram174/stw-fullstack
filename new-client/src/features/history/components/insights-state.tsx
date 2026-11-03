import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function InsightsState({
  status,
  empty,
  onRetry,
}: {
  status: string
  empty?: boolean
  onRetry: () => void
}) {
  if (status === "loading")
    return <Skeleton className="h-96 w-full" aria-label="Loading insights" />
  if (status === "error")
    return (
      <div
        role="alert"
        className="flex min-h-96 flex-col items-center justify-center gap-3 text-center"
      >
        <p className="text-sm text-muted-foreground">
          Unable to load this analysis.
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    )
  if (empty)
    return (
      <div
        role="status"
        className="flex min-h-96 items-center justify-center text-center text-sm text-muted-foreground"
      >
        No records available for this analysis.
      </div>
    )
  return null
}
