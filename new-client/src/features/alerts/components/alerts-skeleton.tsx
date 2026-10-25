import { Skeleton } from "@/components/ui/skeleton"

export function AlertsSkeleton() {
  return (
    <div role="status" aria-label="Loading alerts">
      <span className="sr-only">Loading alerts…</span>
      <div
        aria-hidden="true"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="rounded-xl border bg-card p-6">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="mt-8 h-6 w-3/4" />
            <Skeleton className="mt-3 h-4 w-1/2" />
            <Skeleton className="mt-8 h-7 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
