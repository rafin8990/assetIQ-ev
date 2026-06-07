"use client"

import * as React from "react"
import { Loader2, RefreshCw } from "lucide-react"

import { AssetPerformanceChart } from "@/components/dashboard/asset-performance-chart"
import { RecentItemsTable } from "@/components/dashboard/recent-items-table"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api/client"
import { getDashboardSummary } from "@/services/dashboard"
import type { ChartDataPoint, DashboardStat } from "@/types"
import type { Item } from "@/types/items"

export function AnalyticsPageClient() {
  const [stats, setStats] = React.useState<DashboardStat[]>([])
  const [chartData, setChartData] = React.useState<ChartDataPoint[]>([])
  const [recentItems, setRecentItems] = React.useState<Item[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchAnalytics = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const summary = await getDashboardSummary()
      setStats(summary.stats.slice(0, 3))
      setChartData(summary.chartData)
      setRecentItems(summary.recentItems)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load analytics"
      setError(message)
      setStats([])
      setChartData([])
      setRecentItems([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#373B44]">
            Analytics
          </h2>
          <p className="text-[#8b95a5]">
            Live asset catalog trends and recent item activity.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchAnalytics}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <RefreshCw />
          )}
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-[#e8eaed] bg-white text-[#8b95a5]">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-5 animate-spin" />
            Loading analytics...
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
            title="Items Added Over Time"
            description="Monthly item creation from your catalog API"
            valueLabel="Items Added"
            showSecondary={false}
          />

          <RecentItemsTable items={recentItems} />
        </>
      )}
    </div>
  )
}
