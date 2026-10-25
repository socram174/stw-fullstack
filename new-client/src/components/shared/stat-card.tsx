import type { LucideIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface StatCardProps {
  label: string
  value: string | number
  description: string
  icon: LucideIcon
  loading?: boolean
}

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  loading,
}: StatCardProps) {
  return (
    <div className="min-w-0 rounded-xl border bg-card p-3.5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="min-h-8 text-xs text-muted-foreground sm:min-h-0 sm:text-sm">
          {label}
        </p>
        <Icon
          className="hidden size-4 text-muted-foreground sm:block"
          aria-hidden="true"
        />
      </div>
      {loading ? (
        <Skeleton className="mt-4 h-8 w-12 sm:w-20" />
      ) : (
        <p
          className="mt-3 truncate text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl"
          title={String(value)}
        >
          {value}
        </p>
      )}
      <p className="mt-2 hidden text-xs text-muted-foreground sm:block">
        {description}
      </p>
    </div>
  )
}
