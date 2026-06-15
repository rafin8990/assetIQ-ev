"use client"

import * as React from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
  Package,
  Search,
} from "lucide-react"

import {
  formatQuantity,
  formatVendorDisplay,
  selectClassName,
} from "@/components/inventory/inventory-constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api/client"
import {
  getTotalStock,
  getTotalStockBreakdown,
} from "@/services/inventory"
import { getVendors } from "@/services/vendors"
import type {
  TotalStockLocationBreakdown,
  TotalStockRow,
} from "@/types/inventory"
import type { Vendor } from "@/types/vendors"

type RowKey = string

function rowKey(row: TotalStockRow): RowKey {
  return `${row.item_id}-${row.vendor_id ?? "null"}`
}

export function TotalStockPageClient() {
  const [rows, setRows] = React.useState<TotalStockRow[]>([])
  const [vendors, setVendors] = React.useState<Vendor[]>([])
  const [vendorFilter, setVendorFilter] = React.useState("")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [appliedSearch, setAppliedSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [expanded, setExpanded] = React.useState<Record<RowKey, boolean>>({})
  const [breakdownCache, setBreakdownCache] = React.useState<
    Record<RowKey, TotalStockLocationBreakdown[]>
  >({})
  const [breakdownLoading, setBreakdownLoading] = React.useState<
    Record<RowKey, boolean>
  >({})

  React.useEffect(() => {
    getVendors({ limit: 200, sortBy: "vendor_name", sortOrder: "asc" })
      .then(res => setVendors(res.data))
      .catch(() => setVendors([]))
  }, [])

  const fetchStock = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getTotalStock({
        page,
        limit: 10,
        vendorId: vendorFilter ? Number(vendorFilter) : undefined,
        searchTerm: appliedSearch || undefined,
      })
      setRows(result.data)
      setTotal(result.meta?.total ?? 0)
      setTotalPages(result.meta?.totalPages ?? 1)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load total stock"
      setError(message)
      setRows([])
    } finally {
      setIsLoading(false)
    }
  }, [appliedSearch, page, vendorFilter])

  React.useEffect(() => {
    fetchStock()
  }, [fetchStock])

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    setPage(1)
    setAppliedSearch(searchTerm.trim())
  }

  const toggleExpand = async (row: TotalStockRow) => {
    const key = rowKey(row)
    const next = !expanded[key]
    setExpanded(current => ({ ...current, [key]: next }))

    if (next && !breakdownCache[key]) {
      setBreakdownLoading(current => ({ ...current, [key]: true }))
      try {
        const breakdown = await getTotalStockBreakdown(
          row.item_id,
          row.vendor_id
        )
        setBreakdownCache(current => ({ ...current, [key]: breakdown }))
      } catch {
        setBreakdownCache(current => ({ ...current, [key]: [] }))
      } finally {
        setBreakdownLoading(current => ({ ...current, [key]: false }))
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#373B44]">Total Stock</h1>
        <p className="text-sm text-[#8b95a5]">
          Aggregated quantity across all locations by item and vendor
        </p>
      </div>

      <div className="rounded-xl border border-[#e8eaed] bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#373B44]">
              Vendor filter
            </label>
            <select
              value={vendorFilter}
              onChange={event => {
                setVendorFilter(event.target.value)
                setPage(1)
              }}
              className={selectClassName}
            >
              <option value="">All vendors</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id}>
                  {v.vendor_name}
                </option>
              ))}
            </select>
          </div>
          <form onSubmit={handleSearch} className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-[#373B44]">Search</label>
              <Input
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Item or vendor"
              />
            </div>
            <Button type="submit" variant="outline">
              <Search />
            </Button>
          </form>
        </div>
      </div>

      <div className="rounded-xl border border-[#e8eaed] bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#4DC591]" />
          </div>
        ) : error ? (
          <div className="px-6 py-8 text-sm text-red-600">{error}</div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-[#8b95a5]">
            <Package className="h-10 w-10" />
            <p>No stock found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e8eaed] bg-[#f8f9fb]">
                  <th className="w-10 px-4 py-3" />
                  <th className="px-4 py-3 font-semibold text-[#373B44]">
                    Item
                  </th>
                  <th className="px-4 py-3 font-semibold text-[#373B44]">
                    Vendor
                  </th>
                  <th className="px-4 py-3 font-semibold text-[#373B44]">
                    Total Qty
                  </th>
                  <th className="px-4 py-3 font-semibold text-[#373B44]">
                    Unit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8eaed]">
                {rows.map(row => {
                  const key = rowKey(row)
                  const isExpanded = expanded[key]

                  return (
                    <React.Fragment key={key}>
                      <tr>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleExpand(row)}
                            className="text-[#8b95a5] hover:text-[#373B44]"
                          >
                            {isExpanded ? <ChevronUp /> : <ChevronDown />}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-medium text-[#373B44]">
                          {row.item_name ?? `Item #${row.item_id}`}
                        </td>
                        <td className="px-4 py-3 text-[#5c6370]">
                          {formatVendorDisplay(
                            row.vendor_name,
                            row.vendor_company_name
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#373B44]">
                          {formatQuantity(row.quantity)}
                        </td>
                        <td className="px-4 py-3 text-[#5c6370]">
                          {row.unit_name ?? "—"}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-[#fafbfc]">
                          <td colSpan={5} className="px-8 py-3">
                            {breakdownLoading[key] ? (
                              <Loader2 className="h-5 w-5 animate-spin text-[#4DC591]" />
                            ) : (breakdownCache[key] ?? []).length === 0 ? (
                              <p className="text-xs text-[#8b95a5]">
                                No location breakdown
                              </p>
                            ) : (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-[#8b95a5]">
                                    <th className="pb-2 text-left font-medium">
                                      Location
                                    </th>
                                    <th className="pb-2 text-left font-medium">
                                      Quantity
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(breakdownCache[key] ?? []).map(loc => (
                                    <tr key={loc.location_id}>
                                      <td className="py-1 text-[#5c6370]">
                                        {loc.location_name ??
                                          `Location #${loc.location_id}`}
                                      </td>
                                      <td className="py-1 text-[#373B44]">
                                        {formatQuantity(loc.quantity)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#e8eaed] px-5 py-4">
            <p className="text-sm text-[#8b95a5]">{total} rows</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft />
              </Button>
              <span className="text-sm text-[#5c6370]">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
