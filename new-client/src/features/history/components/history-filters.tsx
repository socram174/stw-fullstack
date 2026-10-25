import { useState } from "react"
import type { FormEvent } from "react"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MissionFilters } from "@/features/alerts/components/mission-filters"
import type { MissionFiltersValue } from "@/features/alerts/types"
import { formatNumber } from "@/lib/format"

export interface HistoryFiltersValue extends MissionFiltersValue {
  from: string
  to: string
}

const emptyFilters: HistoryFiltersValue = {
  search: "",
  zone: "",
  sort: "recent",
  from: "",
  to: "",
}

export function HistoryFilters({
  value,
  zones,
  disabled,
  loading,
  resultCount,
  onApply,
  onClear,
}: {
  value: HistoryFiltersValue
  zones: string[]
  disabled: boolean
  loading: boolean
  resultCount: number
  onApply: (value: HistoryFiltersValue) => void
  onClear: () => void
}) {
  const [draft, setDraft] = useState(value)
  const invalidRange = Boolean(draft.from && draft.to && draft.from > draft.to)
  const hasFilters = Boolean(
    draft.search ||
    draft.zone ||
    draft.from ||
    draft.to ||
    draft.sort !== "recent"
  )

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const next = {
      ...draft,
      from: String(fields.get("from") ?? ""),
      to: String(fields.get("to") ?? ""),
    }
    setDraft(next)
    if (!next.from || !next.to || next.from <= next.to) onApply(next)
  }

  return (
    <form
      aria-label="History filters"
      onSubmit={submit}
      className="space-y-4 rounded-xl border bg-card p-5"
    >
      <MissionFilters
        value={draft}
        onChange={(filters) => setDraft({ ...draft, ...filters })}
        zones={zones}
        history
        disabled={disabled}
      />
      <div className="grid grid-cols-2 items-end gap-3 border-t pt-4 sm:flex sm:flex-wrap">
        <div className="min-w-0 sm:flex-none">
          <label
            htmlFor="history-from"
            className="mb-1.5 block text-xs text-muted-foreground"
          >
            From
          </label>
          <Input
            id="history-from"
            name="from"
            type="date"
            value={draft.from}
            max={draft.to || undefined}
            disabled={disabled}
            aria-invalid={invalidRange}
            onChange={(event) =>
              setDraft({ ...draft, from: event.target.value })
            }
            className="w-full sm:w-44"
          />
        </div>
        <div className="min-w-0 sm:flex-none">
          <label
            htmlFor="history-to"
            className="mb-1.5 block text-xs text-muted-foreground"
          >
            To
          </label>
          <Input
            id="history-to"
            name="to"
            type="date"
            value={draft.to}
            min={draft.from || undefined}
            disabled={disabled}
            aria-invalid={invalidRange}
            onChange={(event) => setDraft({ ...draft, to: event.target.value })}
            className="w-full sm:w-44"
          />
        </div>
        <Button
          type="submit"
          disabled={disabled || invalidRange}
          className="col-span-2 sm:col-auto"
        >
          <Search className="size-4" aria-hidden="true" />
          Apply filters
        </Button>
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="col-span-2 justify-self-start"
            onClick={() => {
              setDraft(emptyFilters)
              onClear()
            }}
          >
            <X className="size-3.5" aria-hidden="true" />
            Clear filters
          </Button>
        )}
        <p
          className="col-span-2 w-full text-xs text-muted-foreground sm:ml-auto sm:w-auto"
          role="status"
        >
          {!disabled
            ? `${formatNumber(resultCount)} ${resultCount === 1 ? "record" : "records"} in this selection`
            : loading
              ? "Loading records…"
              : "Records unavailable"}
        </p>
      </div>
      {invalidRange && (
        <p role="alert" className="text-sm text-destructive">
          The start date must be on or before the end date.
        </p>
      )}
    </form>
  )
}
