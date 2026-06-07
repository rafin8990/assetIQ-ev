"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { AssetPerformanceChart } from "@/components/dashboard/asset-performance-chart"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { RecentItemsTable } from "@/components/dashboard/recent-items-table"
import { StatCard } from "@/components/dashboard/stat-card"
import { ApiError } from "@/lib/api/client"
import { getDashboardSummary } from "@/services/dashboard"
import { getHealthStatus } from "@/services/health"
import type { ChartDataPoint, DashboardStat } from "@/types"
import type { Item } from "@/types/items"

export function DashboardPageClient() {
  const [stats, setStats] = React.useState<DashboardStat[]>([])
  const [chartData, setChartData] = React.useState<ChartDataPoint[]>([])
  const [recentItems, setRecentItems] = React.useState<Item[]>([])
  const [apiStatus, setApiStatus] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchDashboard = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [summary, health] = await Promise.all([
        getDashboardSummary(),
        getHealthStatus().catch(() => null),
      ])

      setStats(summary.stats)
      setChartData(summary.chartData)
      setRecentItems(summary.recentItems)
      setApiStatus(health?.message ?? null)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load dashboard"
      setError(message)
      setStats([])
      setChartData([])
      setRecentItems([])
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map(stat => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>

          <AssetPerformanceChart
            data={chartData}
            title="Catalog Growth"
            description="Items added per month from your live inventory"
            valueLabel="Items Added"
            showSecondary={false}
          />

          <RecentItemsTable items={recentItems} />
        </>
      )}
    </div>
  )
}
