import { Search, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import type { MissionFiltersValue, MissionSort } from "../types"

export function MissionFilters({
  value,
  onChange,
  zones,
  history = false,
  disabled = false,
}: {
  value: MissionFiltersValue
  onChange: (value: MissionFiltersValue) => void
  zones: string[]
  history?: boolean
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          aria-label="Search missions"
          placeholder="Search mission, zone or level…"
          value={value.search}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, search: event.target.value })
          }
          className="h-10 bg-card pl-9"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:flex">
        <NativeSelect
          aria-label="Filter by zone"
          className="w-full bg-card sm:w-44 [&_select]:text-xs sm:[&_select]:text-sm"
          value={value.zone}
          disabled={disabled}
          onChange={(event) => onChange({ ...value, zone: event.target.value })}
        >
          <NativeSelectOption value="">All zones</NativeSelectOption>
          {zones.map((zone) => (
            <NativeSelectOption key={zone} value={zone}>
              {zone}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <div className="relative">
          <SlidersHorizontal
            className="pointer-events-none absolute top-1/2 left-3 z-10 hidden size-3.5 -translate-y-1/2 text-muted-foreground sm:block"
            aria-hidden="true"
          />
          <NativeSelect
            aria-label="Sort missions"
            className="w-full bg-card [&_select]:text-xs sm:[&_select]:pl-9 sm:[&_select]:text-sm"
            value={value.sort}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...value, sort: event.target.value as MissionSort })
            }
          >
            {history && (
              <NativeSelectOption value="recent">
                Most recent
              </NativeSelectOption>
            )}
            <NativeSelectOption value="power">Lowest level</NativeSelectOption>
            <NativeSelectOption value="reward">Most V-Bucks</NativeSelectOption>
          </NativeSelect>
        </div>
      </div>
    </div>
  )
}
