import type { ReactNode } from "react"
import { CircleAlert, SearchX } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeedbackStateProps {
  title: string
  description: string
  error?: boolean
  children?: ReactNode
}

export function FeedbackState({
  title,
  description,
  error,
  children,
}: FeedbackStateProps) {
  const Icon = error ? CircleAlert : SearchX
  return (
    <div
      className="flex flex-col items-center rounded-xl border border-dashed bg-card px-6 py-14 text-center"
      role={error ? "alert" : "status"}
    >
      <span
        className={cn(
          "mb-5 flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground",
          error && "bg-destructive/10 text-destructive"
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}
