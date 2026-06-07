import {
  FolderTree,
  GitBranch,
  Package,
  Ruler,
  Tag,
} from "lucide-react"

import { getBrands } from "@/services/brands"
import { getCategories } from "@/services/categories"
import { getItems } from "@/services/items"
import { getSubCategories } from "@/services/sub-categories"
import { getUnits } from "@/services/units"
import type { ChartDataPoint, DashboardStat } from "@/types"
import type { Item } from "@/types/items"

export type DashboardSummary = {
  stats: DashboardStat[]
  chartData: ChartDataPoint[]
  recentItems: Item[]
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

function countCreatedSince(items: Item[], days: number) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return items.filter(item => new Date(item.created_at).getTime() >= cutoff)
    .length
}

function buildMonthlyChartData(items: Item[]): ChartDataPoint[] {
  const now = new Date()
  const months: ChartDataPoint[] = []

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const month = date.getMonth()
    const year = date.getFullYear()
    const label = MONTH_LABELS[month]

    const count = items.filter(item => {
      const created = new Date(item.created_at)
      return (
        created.getMonth() === month && created.getFullYear() === year
      )
    }).length

    months.push({ name: label, value: count })
  }

  return months
}

async function fetchItemsForChart(total: number) {
  if (total <= 0) return []

  const limit = 100
  const totalPages = Math.min(Math.ceil(total / limit), 10)
  const pages = await Promise.all(
    Array.from({ length: totalPages }, (_, index) =>
      getItems({
        page: index + 1,
        limit,
        sortBy: "created_at",
        sortOrder: "asc",
      })
    )
  )

  return pages.flatMap(page => page.data)
}

function formatCount(value: number) {
  return value.toLocaleString()
}

function buildChangeLabel(count: number, label: string) {
  if (count <= 0) return { change: `0 ${label}`, trend: "neutral" as const }
  return { change: `+${count} ${label}`, trend: "up" as const }
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [
    itemsMeta,
    categoriesMeta,
    subCategoriesMeta,
    brandsMeta,
    unitsMeta,
    recentItemsRes,
  ] = await Promise.all([
    getItems({ limit: 1 }),
    getCategories({ limit: 1 }),
    getSubCategories({ limit: 1 }),
    getBrands({ limit: 1 }),
    getUnits({ limit: 1 }),
    getItems({ limit: 8, sortBy: "created_at", sortOrder: "desc" }),
  ])

  const chartItems = await fetchItemsForChart(itemsMeta.meta?.total ?? 0)
  const itemsThisMonth = countCreatedSince(chartItems, 30)

  const stats: DashboardStat[] = [
    {
      title: "Total Items",
      value: formatCount(itemsMeta.meta?.total ?? 0),
      ...buildChangeLabel(itemsThisMonth, "this month"),
      icon: Package,
      accent: "green",
    },
    {
      title: "Categories",
      value: formatCount(categoriesMeta.meta?.total ?? 0),
      change: "Asset catalog",
      trend: "neutral",
      icon: FolderTree,
      accent: "dark",
    },
    {
      title: "Sub Categories",
      value: formatCount(subCategoriesMeta.meta?.total ?? 0),
      change: "Classifications",
      trend: "neutral",
      icon: GitBranch,
      accent: "teal",
    },
    {
      title: "Brands",
      value: formatCount(brandsMeta.meta?.total ?? 0),
      change: "Manufacturers",
      trend: "neutral",
      icon: Tag,
      accent: "green",
    },
    {
      title: "Units",
      value: formatCount(unitsMeta.meta?.total ?? 0),
      change: "Measurement",
      trend: "neutral",
      icon: Ruler,
      accent: "dark",
    },
    {
      title: "Recent Activity",
      value: formatCount(recentItemsRes.data.length),
      change: "Latest items",
      trend: "up",
      icon: Package,
      accent: "teal",
    },
  ]

  return {
    stats,
    chartData: buildMonthlyChartData(chartItems),
    recentItems: recentItemsRes.data,
  }
}
