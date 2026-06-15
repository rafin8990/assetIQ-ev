"use client"

import * as React from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Search,
  Truck,
} from "lucide-react"

import {
  formatDate,
  formatStatus,
  formatVendorDisplay,
  getStatusBadgeClass,
  STAGING_STATUS_TABS,
} from "@/components/purchase-orders/purchase-order-constants"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api/client"
import { getStagingPurchaseOrders } from "@/services/purchase-orders"
import type { StagingPurchaseOrder } from "@/types/purchase-order-staging"

type StatusFilter = (typeof STAGING_STATUS_TABS)[number]["value"]

export function PoReceivingListPageClient() {
  const [orders, setOrders] = React.useState<StagingPurchaseOrder[]>([])
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [appliedSearch, setAppliedSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchList = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getStagingPurchaseOrders({
        page,
        limit: 10,
        searchTerm: appliedSearch || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      })

      setOrders(result.data)
      setTotal(result.meta?.total ?? 0)
      setTotalPages(result.meta?.totalPages ?? 1)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load staging purchase orders"
      setError(message)
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }, [appliedSearch, page, statusFilter])

  React.useEffect(() => {
    fetchList()
  }, [fetchList])

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    setPage(1)
    setAppliedSearch(searchTerm.trim())
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#373B44]">
          PO Receiving
        </h2>
        <p className="text-[#8b95a5]">
          View approved and staging purchase orders ready for receiving.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
        <div className="border-b border-[#e8eaed] bg-gradient-to-r from-[#373B44] to-[#4a4f5c] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Truck className="size-5 text-[#4DC591]" />
              <div>
                <h3 className="text-base font-semibold text-white">
                  Purchase Orders
                </h3>
                <p className="text-sm text-white/70">
                  {total} purchase order{total === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-[#e8eaed] px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {STAGING_STATUS_TABS.map(tab => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.value)
                  setPage(1)
                }}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  statusFilter === tab.value
                    ? "bg-[#373B44] text-white"
                    : "bg-[#f0f2f5] text-[#5c6370] hover:bg-[#e8eaed]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8b95a5]" />
              <Input
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Search PO number..."
                className="h-9 pl-9"
              />
            </div>
            <Button type="submit" variant="outline" size="sm">
              Search
            </Button>
          </form>
        </div>

        {error && (
          <div className="border-b border-[#e8eaed] bg-red-50 px-5 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e8eaed] bg-[#f8f9fb]">
                <th className="px-5 py-3 font-semibold text-[#373B44]">PO #</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Vendor
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Status
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Receive Progress
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Staged At
                </th>
                <th className="px-5 py-3 text-right font-semibold text-[#373B44]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8eaed]">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-[#8b95a5]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading purchase orders...
                    </span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-[#8b95a5]"
                  >
                    No purchase orders ready for receiving.
                  </td>
                </tr>
              ) : (
                orders.map(po => {
                  const progress =
                    po.total_lines > 0
                      ? Math.round(
                          (po.fully_received_lines / po.total_lines) * 100
                        )
                      : 0

                  return (
                    <tr
                      key={po.id}
                      className="transition-colors hover:bg-[#f8f9fb]"
                    >
                      <td className="px-5 py-3.5 font-semibold text-[#373B44]">
                        {po.po_number}
                      </td>
                      <td className="px-5 py-3.5 text-[#5c6370]">
                        {formatVendorDisplay(po)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                            getStatusBadgeClass(po.status)
                          )}
                        >
                          {formatStatus(po.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="min-w-[140px]">
                          <div className="mb-1 flex justify-between text-xs text-[#8b95a5]">
                            <span>
                              {po.fully_received_lines}/{po.total_lines} lines
                            </span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-[#f0f2f5]">
                            <div
                              className="h-full rounded-full bg-[#4DC591] transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[#5c6370]">
                        {po.staged_at ? formatDate(po.staged_at) : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/procurement/po-receiving/${po.id}`}
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                          })}
                        >
                          <Eye />
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#e8eaed] px-5 py-3">
          <p className="text-xs text-[#8b95a5]">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage(current => current - 1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage(current => current + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
