"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { AssetPerformanceChart } from "@/components/dashboard/asset-performance-chart"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardSection } from "@/components/dashboard/dashboard-section"
import { MovementHistory } from "@/components/dashboard/movement-history"
import { PendingApprovalsTable } from "@/components/dashboard/pending-approvals-table"
import { RecentItemsTable } from "@/components/dashboard/recent-items-table"
import { ApiError } from "@/lib/api/client"
import { getAuthUser } from "@/lib/auth/token"
import { getDashboardSummary } from "@/services/dashboard"
import { getHealthStatus } from "@/services/health"
import type {
  ChartDataPoint,
  DashboardStatSection,
  MovementHistoryItem,
  PendingApprovalItem,
} from "@/types"
import type { Item } from "@/types/items"

export function DashboardPageClient() {
  const [sections, setSections] = React.useState<DashboardStatSection[]>([])
  const [chartData, setChartData] = React.useState<ChartDataPoint[]>([])
  const [activityChart, setActivityChart] = React.useState<ChartDataPoint[]>([])
  const [recentItems, setRecentItems] = React.useState<Item[]>([])
  const [pendingApprovals, setPendingApprovals] = React.useState<
    PendingApprovalItem[]
  >([])
  const [movementHistory, setMovementHistory] = React.useState<
    MovementHistoryItem[]
  >([])
  const [userName, setUserName] = React.useState<string | null>(null)
  const [apiStatus, setApiStatus] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchDashboard = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const cachedUser = getAuthUser()
    if (cachedUser?.name) {
      setUserName(cachedUser.name)
    }

    try {
      const [summary, health] = await Promise.all([
        getDashboardSummary(),
        getHealthStatus().catch(() => null),
      ])

      setSections(summary.sections)
      setChartData(summary.chartData)
      setActivityChart(summary.activityChart)
      setRecentItems(summary.recentItems)
      setPendingApprovals(summary.pendingApprovals)
      setMovementHistory(summary.movementHistory)
      setApiStatus(health?.message ?? null)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load dashboard"
      setError(message)
      setSections([])
      setChartData([])
      setActivityChart([])
      setRecentItems([])
      setPendingApprovals([])
      setMovementHistory([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  return (
    <div className="space-y-6">
      <DashboardHeader
        userName={userName}
        apiStatus={apiStatus}
        onRefresh={fetchDashboard}
        isRefreshing={isLoading}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-[#e8eaed] bg-white text-[#8b95a5]">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-5 animate-spin" />
            Loading dashboard data...
          </span>
        </div>
      ) : (
        <>
          <div className="space-y-8">
            {sections.map(section => (
              <DashboardSection key={section.title} {...section} />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <AssetPerformanceChart
              data={activityChart}
              title="Procurement vs Outbound"
              description="Monthly requisitions, purchase orders, and out requests"
              valueLabel="Procurement"
              secondaryLabel="Outbound"
              showSecondary
            />
            <AssetPerformanceChart
              data={chartData}
              title="Catalog Growth"
              description="Items added per month from your live inventory"
              valueLabel="Items Added"
              showSecondary={false}
            />
          </div>

          <PendingApprovalsTable items={pendingApprovals} />

          <div className="grid gap-6 xl:grid-cols-2">
            <RecentItemsTable items={recentItems} />
            <MovementHistory items={movementHistory} />
          </div>
        </>
      )}
    </div>
  )
}
