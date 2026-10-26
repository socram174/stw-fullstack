import type { RewardBucket } from "../../alerts/types.ts"

export function summarizeRewardBuckets(buckets: readonly RewardBucket[]) {
  return buckets.reduce(
    (totals, bucket) => ({
      totalVbucks: totals.totalVbucks + (bucket.vbucks ?? 0),
      missions: totals.missions + bucket.missions,
      days: totals.days + bucket.recordedDays,
    }),
    { totalVbucks: 0, missions: 0, days: 0 }
  )
}
