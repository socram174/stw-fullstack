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
