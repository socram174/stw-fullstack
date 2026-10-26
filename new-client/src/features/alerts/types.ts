export interface MissionAlert {
  id: string
  date: string
  mission: string
  location: string
  zone: string
  powerLevel: number
  vbucks: number
  afterReset: boolean
}

export type MissionSort = "power" | "reward" | "recent"

export interface MissionFiltersValue {
  search: string
  zone: string
  sort: MissionSort
}

export interface DailyReward {
  date: string
  vbucks: number
  missions: number
}

export type RewardPeriod = "7d" | "1m" | "6m" | "1y" | "all"

export interface RewardBucket {
  date: string
  endDate: string
  vbucks: number | null
  missions: number
  recordedDays: number
  totalDays: number
}

export interface AlertRewardsResponse {
  period: RewardPeriod
  interval: "day" | "week" | "month"
  from: string
  to: string
  data: RewardBucket[]
}

export interface AlertSummary {
  totalVbucks: number
  missions: number
  zones: number
  minPower: number | null
  days: number
}

export interface LatestAlertsResponse {
  data: MissionAlert[]
  rotation: { date: string; afterReset: boolean } | null
  summary: AlertSummary
}

export interface HistoryPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface AlertHistoryResponse {
  data: MissionAlert[]
  pagination: HistoryPagination
  summary: AlertSummary
  dailyRewards: DailyReward[]
  zones: string[]
}
