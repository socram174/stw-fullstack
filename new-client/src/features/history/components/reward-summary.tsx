import { CalendarDays, Coins, Crosshair } from "lucide-react"
import { StatCard } from "@/components/shared/stat-card"
import type { RewardBucket } from "@/features/alerts/types"
import { formatNumber } from "@/lib/format"
import { summarizeRewardBuckets } from "../lib/reward-summary"

interface RewardSummaryProps {
  buckets: RewardBucket[] | null
  loading: boolean
}

export function RewardSummary({ buckets, loading }: RewardSummaryProps) {
  const totals = buckets ? summarizeRewardBuckets(buckets) : null
  const hasRecords = totals !== null && totals.days > 0

  return (
    <div
      className="mb-7 grid grid-cols-3 gap-2 sm:gap-4"
      aria-label="Selected period totals"
      aria-busy={loading}
    >
      <StatCard
        label="V-Bucks recorded"
        value={hasRecords ? formatNumber(totals.totalVbucks) : "—"}
        description="Recorded rewards in this period"
        icon={Coins}
        loading={loading}
      />
      <StatCard
        label="V-Buck missions"
        value={hasRecords ? formatNumber(totals.missions) : "—"}
        description="Reward missions in this period"
        icon={Crosshair}
        loading={loading}
      />
      <StatCard
        label="Days recorded"
        value={totals ? formatNumber(totals.days) : "—"}
        description="Including recorded zero-reward days"
        icon={CalendarDays}
        loading={loading}
      />
    </div>
  )
}
