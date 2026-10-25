import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const zoneStyles: Record<string, string> = {
  Stonewood: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  Plankerton: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  "Canny Valley": "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  "Twine Peaks": "bg-violet-500/10 text-violet-700 dark:text-violet-400",
}

export function ZoneBadge({ zone }: { zone: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1.5 rounded-md px-2 py-3 font-medium",
        zoneStyles[zone]
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {zone}
    </Badge>
  )
}
