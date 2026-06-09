import {
  ClipboardList,
  FolderTree,
  GitBranch,
  Package,
  RotateCcw,
  Ruler,
  ShoppingCart,
  Tag,
  Truck,
  Users,
  Warehouse,
} from "lucide-react"

import { getBrands } from "@/services/brands"
import { getCategories } from "@/services/categories"
import { getItems } from "@/services/items"
import { getOutRequests } from "@/services/out-requests"
import { getPurchaseOrders } from "@/services/purchase-orders"
import { getReturnRequests } from "@/services/returns"
import { getRequisitions } from "@/services/requisitions"
import { getStocks } from "@/services/stocks"
import { getSubCategories } from "@/services/sub-categories"
import { getUnits } from "@/services/units"
import { getUsers } from "@/services/users"
import { getVendors } from "@/services/vendors"
import type {
  ChartDataPoint,
  DashboardStat,
  DashboardStatSection,
  MovementHistoryItem,
  PendingApprovalItem,
} from "@/types"
import type { Item } from "@/types/items"
import type { OutRequest } from "@/types/out-requests"
import type { PurchaseOrder } from "@/types/purchase-orders"
import type { Requisition } from "@/types/requisitions"
import type { ReturnRequest } from "@/types/returns"
import type { Stock } from "@/types/stocks"

export type DashboardSummary = {
  sections: DashboardStatSection[]
  stats: DashboardStat[]
  chartData: ChartDataPoint[]
  activityChart: ChartDataPoint[]
  recentItems: Item[]
  pendingApprovals: PendingApprovalItem[]
  movementHistory: MovementHistoryItem[]
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

function countCreatedSince<T extends { created_at: string }>(
  items: T[],
  days: number
) {
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
      return created.getMonth() === month && created.getFullYear() === year
    }).length

    months.push({ name: label, value: count })
  }

  return months
}

function buildActivityChartData(
  procurementItems: { created_at: string }[],
  outboundItems: { created_at: string }[]
): ChartDataPoint[] {
  const now = new Date()
  const months: ChartDataPoint[] = []

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const month = date.getMonth()
    const year = date.getFullYear()
    const label = MONTH_LABELS[month]

    const inMonth = (item: { created_at: string }) => {
      const created = new Date(item.created_at)
      return created.getMonth() === month && created.getFullYear() === year
    }

    months.push({
      name: label,
      value: procurementItems.filter(inMonth).length,
      secondary: outboundItems.filter(inMonth).length,
    })
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

async function fetchRecordsForActivity<T extends { created_at: string }>(
  total: number,
  fetchPage: (page: number, limit: number) => Promise<{ data: T[] }>
) {
  if (total <= 0) return []

  const limit = 100
  const totalPages = Math.min(Math.ceil(total / limit), 5)
  const pages = await Promise.all(
    Array.from({ length: totalPages }, (_, index) =>
      fetchPage(index + 1, limit)
    )
  )

  return pages.flatMap(page => page.data)
}

async function sumStockQuantities(total: number) {
  if (total <= 0) return 0

  const limit = 100
  const totalPages = Math.min(Math.ceil(total / limit), 10)
  const pages = await Promise.all(
    Array.from({ length: totalPages }, (_, index) =>
      getStocks({ page: index + 1, limit })
    )
  )

  return pages
    .flatMap(page => page.data)
    .reduce((sum, stock) => sum + Number(stock.quantity ?? 0), 0)
}

function formatCount(value: number) {
  return value.toLocaleString()
}

function buildChangeLabel(count: number, label: string) {
  if (count <= 0) return { change: `0 ${label}`, trend: "neutral" as const }
  return { change: `+${count} ${label}`, trend: "up" as const }
}

function buildPendingLabel(count: number) {
  if (count <= 0) return { change: "All clear", trend: "neutral" as const }
  return {
    change: `${count} awaiting action`,
    trend: "down" as const,
  }
}

function toPendingApproval(
  item: Requisition | PurchaseOrder | OutRequest | ReturnRequest,
  type: PendingApprovalItem["type"],
  typeLabel: string,
  reference: string,
  href: string,
  requestedBy?: string | null
): PendingApprovalItem {
  return {
    id: item.id,
    reference,
    type,
    typeLabel,
    requestedBy,
    createdAt: item.created_at,
    href,
  }
}

function buildMovementHistory(
  stocks: Stock[],
  outRequests: OutRequest[]
): MovementHistoryItem[] {
  type RawMovement = MovementHistoryItem & { sortTime: number }

  const stockMovements: RawMovement[] = stocks.map(stock => ({
    id: `stock-${stock.id}`,
    itemCode: `STK-${stock.id}`,
    itemName: stock.item_name ?? `Item #${stock.item_id}`,
    movement: "in" as const,
    quantity: Number(stock.quantity ?? 0),
    location: "Warehouse",
    sortTime: new Date(stock.updated_at).getTime(),
    time: new Date(stock.updated_at).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }))

  const outMovements: RawMovement[] = outRequests.flatMap(request =>
    request.items.map(item => ({
      id: `out-${request.id}-${item.id}`,
      itemCode: request.request_id,
      itemName: item.item_name ?? `Item #${item.item_id}`,
      movement: "out" as const,
      quantity: Number(item.out_quantity ?? item.requested_quantity ?? 0),
      location: request.requested_by_name ?? "Outbound",
      sortTime: new Date(request.updated_at).getTime(),
      time: new Date(request.updated_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }))
  )

  return [...stockMovements, ...outMovements]
    .sort((a, b) => b.sortTime - a.sortTime)
    .slice(0, 8)
    .map(({ sortTime: _sortTime, ...item }) => item)
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [
    itemsMeta,
    categoriesMeta,
    subCategoriesMeta,
    brandsMeta,
    unitsMeta,
    requisitionsMeta,
    pendingRequisitionsMeta,
    purchaseOrdersMeta,
    pendingPurchaseOrdersMeta,
    stocksMeta,
    vendorsMeta,
    outRequestsMeta,
    pendingOutRequestsMeta,
    completedOutRequestsMeta,
    returnRequestsMeta,
    pendingReturnsMeta,
    usersMeta,
    recentItemsRes,
    pendingRequisitionsRes,
    pendingPurchaseOrdersRes,
    pendingOutRequestsRes,
    pendingReturnsRes,
    recentStocksRes,
    recentOutRequestsRes,
  ] = await Promise.all([
    getItems({ limit: 1 }),
    getCategories({ limit: 1 }),
    getSubCategories({ limit: 1 }),
    getBrands({ limit: 1 }),
    getUnits({ limit: 1 }),
    getRequisitions({ limit: 1 }),
    getRequisitions({ limit: 1, status: "pending" }),
    getPurchaseOrders({ limit: 1 }),
    getPurchaseOrders({ limit: 1, status: "pending" }),
    getStocks({ limit: 1 }),
    getVendors({ limit: 1 }),
    getOutRequests({ limit: 1 }),
    getOutRequests({ limit: 1, status: "pending" }),
    getOutRequests({ limit: 1, status: "out" }),
    getReturnRequests({ limit: 1 }),
    getReturnRequests({ limit: 1, status: "pending" }),
    getUsers({ limit: 1 }),
    getItems({ limit: 8, sortBy: "created_at", sortOrder: "desc" }),
    getRequisitions({
      limit: 5,
      status: "pending",
      sortBy: "created_at",
      sortOrder: "desc",
    }),
    getPurchaseOrders({
      limit: 5,
      status: "pending",
      sortBy: "created_at",
      sortOrder: "desc",
    }),
    getOutRequests({
      limit: 5,
      status: "pending",
      sortBy: "created_at",
      sortOrder: "desc",
    }),
    getReturnRequests({
      limit: 5,
      status: "pending",
      sortBy: "created_at",
      sortOrder: "desc",
    }),
    getStocks({ limit: 5, sortBy: "updated_at", sortOrder: "desc" }),
    getOutRequests({
      limit: 5,
      status: "out",
      sortBy: "updated_at",
      sortOrder: "desc",
    }),
  ])

  const [
    chartItems,
    totalStockQty,
    activityRequisitions,
    activityPurchaseOrders,
    activityOutRequests,
  ] = await Promise.all([
    fetchItemsForChart(itemsMeta.meta?.total ?? 0),
    sumStockQuantities(stocksMeta.meta?.total ?? 0),
    fetchRecordsForActivity(
      requisitionsMeta.meta?.total ?? 0,
      (page, limit) =>
        getRequisitions({ page, limit, sortBy: "created_at", sortOrder: "asc" })
    ),
    fetchRecordsForActivity(
      purchaseOrdersMeta.meta?.total ?? 0,
      (page, limit) =>
        getPurchaseOrders({ page, limit, sortBy: "created_at", sortOrder: "asc" })
    ),
    fetchRecordsForActivity(
      outRequestsMeta.meta?.total ?? 0,
      (page, limit) =>
        getOutRequests({ page, limit, sortBy: "created_at", sortOrder: "asc" })
    ),
  ])

  const itemsThisMonth = countCreatedSince(chartItems, 30)
  const pendingRequisitions = pendingRequisitionsMeta.meta?.total ?? 0
  const pendingPurchaseOrders = pendingPurchaseOrdersMeta.meta?.total ?? 0
  const pendingOutRequests = pendingOutRequestsMeta.meta?.total ?? 0
  const pendingReturns = pendingReturnsMeta.meta?.total ?? 0
  const totalPending =
    pendingRequisitions +
    pendingPurchaseOrders +
    pendingOutRequests +
    pendingReturns

  const assetSection: DashboardStatSection = {
    title: "Assets",
    description: "Catalog and classification overview",
    stats: [
      {
        title: "Total Items",
        value: formatCount(itemsMeta.meta?.total ?? 0),
        ...buildChangeLabel(itemsThisMonth, "this month"),
        icon: Package,
        accent: "green",
        href: "/assets/items",
      },
      {
        title: "Categories",
        value: formatCount(categoriesMeta.meta?.total ?? 0),
        change: "Asset catalog",
        trend: "neutral",
        icon: FolderTree,
        accent: "dark",
        href: "/assets/category",
      },
      {
        title: "Sub Categories",
        value: formatCount(subCategoriesMeta.meta?.total ?? 0),
        change: "Classifications",
        trend: "neutral",
        icon: GitBranch,
        accent: "teal",
        href: "/assets/sub-category",
      },
      {
        title: "Brands",
        value: formatCount(brandsMeta.meta?.total ?? 0),
        change: "Manufacturers",
        trend: "neutral",
        icon: Tag,
        accent: "green",
        href: "/assets/brand",
      },
      {
        title: "Units",
        value: formatCount(unitsMeta.meta?.total ?? 0),
        change: "Measurement",
        trend: "neutral",
        icon: Ruler,
        accent: "dark",
        href: "/assets/units",
      },
    ],
  }

  const procurementSection: DashboardStatSection = {
    title: "Procurement",
    description: "Requisitions, purchase orders, stock, and vendors",
    stats: [
      {
        title: "Requisitions",
        value: formatCount(requisitionsMeta.meta?.total ?? 0),
        ...buildPendingLabel(pendingRequisitions),
        icon: ClipboardList,
        accent: "teal",
        href: "/requisitions",
      },
      {
        title: "Purchase Orders",
        value: formatCount(purchaseOrdersMeta.meta?.total ?? 0),
        ...buildPendingLabel(pendingPurchaseOrders),
        icon: ShoppingCart,
        accent: "green",
        href: "/purchase-orders",
      },
      {
        title: "Stock Records",
        value: formatCount(stocksMeta.meta?.total ?? 0),
        change: `${formatCount(totalStockQty)} total qty`,
        trend: "neutral",
        icon: Warehouse,
        accent: "dark",
        href: "/stock",
      },
      {
        title: "Vendors",
        value: formatCount(vendorsMeta.meta?.total ?? 0),
        change: "Suppliers",
        trend: "neutral",
        icon: Tag,
        accent: "teal",
        href: "/vendor",
      },
    ],
  }

  const outboundSection: DashboardStatSection = {
    title: "Outbound",
    description: "Out requests, approvals, and returns",
    stats: [
      {
        title: "Out Requests",
        value: formatCount(outRequestsMeta.meta?.total ?? 0),
        ...buildPendingLabel(pendingOutRequests),
        icon: Truck,
        accent: "green",
        href: "/outbound/out-request",
      },
      {
        title: "Completed Out",
        value: formatCount(completedOutRequestsMeta.meta?.total ?? 0),
        change: "Fulfilled requests",
        trend: "up",
        icon: Truck,
        accent: "dark",
        href: "/outbound/out-request",
      },
      {
        title: "Return Requests",
        value: formatCount(returnRequestsMeta.meta?.total ?? 0),
        ...buildPendingLabel(pendingReturns),
        icon: RotateCcw,
        accent: "teal",
        href: "/outbound/return",
      },
      {
        title: "Pending Approvals",
        value: formatCount(totalPending),
        change: totalPending > 0 ? "Needs attention" : "All clear",
        trend: totalPending > 0 ? "down" : "neutral",
        icon: ClipboardList,
        accent: "green",
        href: "/outbound/request-approval",
      },
    ],
  }

  const usersSection: DashboardStatSection = {
    title: "Users",
    description: "Team and access management",
    stats: [
      {
        title: "Total Users",
        value: formatCount(usersMeta.meta?.total ?? 0),
        change: "Active accounts",
        trend: "neutral",
        icon: Users,
        accent: "dark",
        href: "/users",
      },
    ],
  }

  const sections = [
    assetSection,
    procurementSection,
    outboundSection,
    usersSection,
  ]

  const pendingApprovals: PendingApprovalItem[] = [
    ...pendingRequisitionsRes.data.map(req =>
      toPendingApproval(
        req,
        "requisition",
        "Requisition",
        req.req_id,
        `/requisitions/${req.id}`,
        req.created_by_name
      )
    ),
    ...pendingPurchaseOrdersRes.data.map(po =>
      toPendingApproval(
        po,
        "purchase_order",
        "Purchase Order",
        po.po_number,
        `/purchase-orders/${po.id}`,
        po.created_by_name
      )
    ),
    ...pendingOutRequestsRes.data.map(req =>
      toPendingApproval(
        req,
        "out_request",
        "Out Request",
        req.request_id,
        `/outbound/out-request/${req.id}`,
        req.requested_by_name
      )
    ),
    ...pendingReturnsRes.data.map(req =>
      toPendingApproval(
        req,
        "return",
        "Return",
        req.return_id,
        `/outbound/return/${req.id}`,
        req.requested_by_name
      )
    ),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const procurementActivity = [
    ...activityRequisitions,
    ...activityPurchaseOrders,
  ]

  return {
    sections,
    stats: sections.flatMap(section => section.stats),
    chartData: buildMonthlyChartData(chartItems),
    activityChart: buildActivityChartData(
      procurementActivity,
      activityOutRequests
    ),
    recentItems: recentItemsRes.data,
    pendingApprovals,
    movementHistory: buildMovementHistory(
      recentStocksRes.data,
      recentOutRequestsRes.data
    ),
  }
}
