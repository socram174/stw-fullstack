export type AlertScope = "today" | "history"

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
