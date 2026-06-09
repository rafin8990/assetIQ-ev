import type { LucideIcon } from "lucide-react"

import type { StatAccent } from "@/lib/brand"

export type StatTrend = "up" | "down" | "neutral"

export type DashboardStat = {
  title: string
  value: string
  change: string
  trend: StatTrend
  icon: LucideIcon
  accent: StatAccent
  href?: string
}

export type DashboardStatSection = {
  title: string
  description?: string
  stats: DashboardStat[]
}

export type PendingApprovalItem = {
  id: number
  reference: string
  type: "requisition" | "purchase_order" | "out_request" | "return"
  typeLabel: string
  requestedBy?: string | null
  createdAt: string
  href: string
}

export type ChartDataPoint = {
  name: string
  value: number
  secondary?: number
}

export type MovementHistoryItem = {
  id: string
  itemCode: string
  itemName: string
  movement: "in" | "out"
  quantity: number
  location: string
  time: string
}
