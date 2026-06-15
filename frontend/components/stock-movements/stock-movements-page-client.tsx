"use client"

import * as React from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Plus,
  Search,
  Truck,
} from "lucide-react"

import {
  STOCK_MOVEMENT_STATUS_LABELS,
  formatQuantity,
  getMovementStatusBadgeClass,
  selectClassName,
} from "@/components/inventory/inventory-constants"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api/client"
import { getAuthUser } from "@/lib/auth/token"
import { getLocationStock } from "@/services/inventory"
import { getLocations } from "@/services/locations"
import {
  createStockMovement,
  getStockMovements,
} from "@/services/stock-movements"
import { getUnits } from "@/services/units"
import type { Location } from "@/types/locations"
import type { LocationStockRow } from "@/types/inventory"
import type {
  StockMovement,
  StockMovementItemPayload,
} from "@/types/stock-movements"
import type { Unit } from "@/types/units"

type SourceLocationItem = {
  item_id: number
  item_name: string | null
  unit_id: number | null
  unit_name: string | null
  available_quantity: number
}

type LineRow = {
  key: string
  item_id: string
  requested_quantity: string
  unit_id: string
  available_quantity: number | null
  loadingAvailability: boolean
}

function aggregateLocationStock(rows: LocationStockRow[]): SourceLocationItem[] {
  const map = new Map<number, SourceLocationItem>()

  for (const row of rows) {
    if (row.quantity <= 0) continue

    const existing = map.get(row.item_id)
    if (existing) {
      existing.available_quantity += row.quantity
      if (!existing.unit_id && row.unit_id) {
        existing.unit_id = row.unit_id
        existing.unit_name = row.unit_name
      }
      continue
    }

    map.set(row.item_id, {
      item_id: row.item_id,
      item_name: row.item_name,
      unit_id: row.unit_id,
      unit_name: row.unit_name,
      available_quantity: row.quantity,
    })
  }

  return Array.from(map.values()).sort((a, b) =>
    (a.item_name ?? "").localeCompare(b.item_name ?? "")
  )
}

function emptyRow(): LineRow {
  return {
    key: `${Date.now()}-${Math.random()}`,
    item_id: "",
    requested_quantity: "",
    unit_id: "",
    available_quantity: null,
    loadingAvailability: false,
  }
}

export function StockMovementsPageClient() {
  const authUser = getAuthUser()

  const [movements, setMovements] = React.useState<StockMovement[]>([])
  const [locations, setLocations] = React.useState<Location[]>([])
  const [sourceLocationItems, setSourceLocationItems] = React.useState<
    SourceLocationItem[]
  >([])
  const [loadingSourceItems, setLoadingSourceItems] = React.useState(false)
  const [units, setUnits] = React.useState<Unit[]>([])
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [appliedSearch, setAppliedSearch] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [createOpen, setCreateOpen] = React.useState(false)
  const [sourceLocationId, setSourceLocationId] = React.useState("")
  const [destLocationId, setDestLocationId] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [lineItems, setLineItems] = React.useState<LineRow[]>([emptyRow()])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  const getSourceItemDetails = React.useCallback(
    (itemId: string, locationItems = sourceLocationItems) => {
      const selectedItem = locationItems.find(
        item => item.item_id === Number(itemId)
      )

      return {
        unit_id: selectedItem?.unit_id ? String(selectedItem.unit_id) : "",
        available_quantity: selectedItem?.available_quantity ?? null,
      }
    },
    [sourceLocationItems]
  )

  const loadSourceLocationItems = React.useCallback(async (locationId: string) => {
    if (!locationId) {
      setSourceLocationItems([])
      return []
    }

    setLoadingSourceItems(true)

    try {
      const result = await getLocationStock({
        locationId: Number(locationId),
        limit: 500,
      })
      const aggregated = aggregateLocationStock(result.data)
      setSourceLocationItems(aggregated)
      return aggregated
    } catch {
      setSourceLocationItems([])
      return []
    } finally {
      setLoadingSourceItems(false)
    }
  }, [])

  const updateLineItem = React.useCallback(
    (index: number, itemId: string, locationItems = sourceLocationItems) => {
      const details = getSourceItemDetails(itemId, locationItems)

      setLineItems(prev => {
        const next = [...prev]
        if (!next[index]) return prev

        next[index] = {
          ...next[index],
          item_id: itemId,
          unit_id: details.unit_id,
          available_quantity: details.available_quantity,
          loadingAvailability: false,
        }
        return next
      })
    },
    [getSourceItemDetails, sourceLocationItems]
  )

  const handleSourceLocationChange = (locationId: string) => {
    setSourceLocationId(locationId)
    setSourceLocationItems([])
    setLineItems(prev =>
      prev.map(row => ({
        ...row,
        item_id: "",
        unit_id: "",
        requested_quantity: "",
        available_quantity: null,
        loadingAvailability: false,
      }))
    )

    void loadSourceLocationItems(locationId)
  }

  const fetchMovements = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getStockMovements({
        page,
        limit: 10,
        sortBy: "created_at",
        sortOrder: "desc",
        searchTerm: appliedSearch || undefined,
      })
      setMovements(result.data)
      setTotal(result.meta?.total ?? 0)
      setTotalPages(result.meta?.totalPages ?? 1)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load stock movements"
      )
      setMovements([])
    } finally {
      setIsLoading(false)
    }
  }, [appliedSearch, page])

  React.useEffect(() => {
    fetchMovements()
  }, [fetchMovements])

  React.useEffect(() => {
    if (!createOpen) return

    Promise.all([
      getLocations({ limit: 200, sortBy: "name", sortOrder: "asc" }),
      getUnits({ limit: 100, sortBy: "name", sortOrder: "asc" }),
    ])
      .then(([locRes, unitRes]) => {
        setLocations(locRes.data)
        setUnits(unitRes.data)
      })
      .catch(() => {
        setLocations([])
        setUnits([])
      })
  }, [createOpen])

  React.useEffect(() => {
    if (!createOpen) {
      setSourceLocationId("")
      setDestLocationId("")
      setNotes("")
      setLineItems([emptyRow()])
      setSourceLocationItems([])
      setFormError(null)
    }
  }, [createOpen])

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    setPage(1)
    setAppliedSearch(searchTerm.trim())
  }

  const handleCreate = async () => {
    if (!authUser?.id) {
      setFormError("You must be logged in")
      return
    }

    if (!sourceLocationId || !destLocationId) {
      setFormError("Source and destination locations are required")
      return
    }

    const payloadItems: StockMovementItemPayload[] = lineItems
      .filter(row => row.item_id && row.requested_quantity)
      .map(row => ({
        item_id: Number(row.item_id),
        requested_quantity: Number(row.requested_quantity),
        unit_id: row.unit_id ? Number(row.unit_id) : null,
      }))

    if (!payloadItems.length) {
      setFormError("Add at least one item with quantity")
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      await createStockMovement({
        source_location_id: Number(sourceLocationId),
        destination_location_id: Number(destLocationId),
        notes: notes.trim() || null,
        requested_by: authUser.id,
        items: payloadItems,
      })
      setCreateOpen(false)
      setSourceLocationId("")
      setDestLocationId("")
      setNotes("")
      setLineItems([emptyRow()])
      setSourceLocationItems([])
      fetchMovements()
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to create movement"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#373B44]">
            Stock Movements
          </h1>
          <p className="text-sm text-[#8b95a5]">
            Transfer stock between locations
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          New Movement
        </Button>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex flex-wrap items-center gap-3 rounded-xl border border-[#e8eaed] bg-white p-4"
      >
        <Input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search movement number or notes"
          className="max-w-sm"
        />
        <Button type="submit" variant="outline">
          <Search />
          Search
        </Button>
      </form>

      <div className="rounded-xl border border-[#e8eaed] bg-white">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#4DC591]" />
          </div>
        ) : error ? (
          <div className="px-6 py-8 text-sm text-red-600">{error}</div>
        ) : movements.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-[#8b95a5]">
            <Truck className="h-10 w-10" />
            <p>No stock movements found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e8eaed] bg-[#f8f9fb]">
                  <th className="px-5 py-3 font-semibold">Movement #</th>
                  <th className="px-5 py-3 font-semibold">Source</th>
                  <th className="px-5 py-3 font-semibold">Destination</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Items</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8eaed]">
                {movements.map(m => (
                  <tr key={m.id}>
                    <td className="px-5 py-3.5 font-medium text-[#373B44]">
                      {m.movement_number}
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {m.source_location_name ?? `#${m.source_location_id}`}
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {m.destination_location_name ??
                        `#${m.destination_location_id}`}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium",
                          getMovementStatusBadgeClass(m.status)
                        )}
                      >
                        {STOCK_MOVEMENT_STATUS_LABELS[m.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {m.items.length}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/inventory/stock-movements/${m.id}`}
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
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#e8eaed] px-5 py-4">
            <p className="text-sm text-[#8b95a5]">{total} movements</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft />
              </Button>
              <span className="text-sm">
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl gap-0 p-0">
          <DialogHeader>
            <DialogTitle>New Stock Movement</DialogTitle>
            <DialogDescription>
              Request a transfer from source to destination location.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#373B44]">
                  Source location
                </label>
                <select
                  value={sourceLocationId}
                  onChange={e => handleSourceLocationChange(e.target.value)}
                  className={selectClassName}
                >
                  <option value="">Select source</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#373B44]">
                  Destination location
                </label>
                <select
                  value={destLocationId}
                  onChange={e => setDestLocationId(e.target.value)}
                  className={selectClassName}
                >
                  <option value="">Select destination</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#373B44]">Notes</label>
              <Input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <label className="text-sm font-medium text-[#373B44]">
                    Line items
                  </label>
                  <p className="text-xs text-[#8b95a5]">
                    Select item, requested quantity, and unit
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    !sourceLocationId ||
                    loadingSourceItems ||
                    !sourceLocationItems.length
                  }
                  onClick={() => setLineItems(prev => [...prev, emptyRow()])}
                >
                  <Plus />
                  Add line
                </Button>
              </div>
              <div className="space-y-3">
                {lineItems.map((row, index) => {
                  const selectedUnit = units.find(
                    unit => unit.id === Number(row.unit_id)
                  )

                  return (
                    <div
                      key={row.key}
                      className="space-y-2 rounded-lg border border-[#e8eaed] bg-[#f8f9fb] p-4"
                    >
                      <div className="grid gap-3 md:grid-cols-[1.4fr_120px_1fr_auto]">
                        <select
                          value={row.item_id}
                          onChange={e => {
                            updateLineItem(index, e.target.value)
                          }}
                          className={selectClassName}
                          disabled={!sourceLocationId || loadingSourceItems}
                        >
                          <option value="">
                            {!sourceLocationId
                              ? "Select source first"
                              : loadingSourceItems
                                ? "Loading items..."
                                : sourceLocationItems.length
                                  ? "Select item"
                                  : "No stock at source"}
                          </option>
                          {sourceLocationItems.map(item => (
                            <option key={item.item_id} value={item.item_id}>
                              {item.item_name ?? `Item #${item.item_id}`}
                            </option>
                          ))}
                        </select>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          placeholder="Qty"
                          value={row.requested_quantity}
                          onChange={e => {
                            const next = [...lineItems]
                            next[index] = {
                              ...row,
                              requested_quantity: e.target.value,
                            }
                            setLineItems(next)
                          }}
                        />
                        <select
                          value={row.unit_id}
                          onChange={e => {
                            const next = [...lineItems]
                            next[index] = { ...row, unit_id: e.target.value }
                            setLineItems(next)
                          }}
                          className={selectClassName}
                        >
                          <option value="">Unit</option>
                          {units.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={lineItems.length <= 1}
                          onClick={() =>
                            setLineItems(prev =>
                              prev.filter((_, i) => i !== index)
                            )
                          }
                        >
                          Remove
                        </Button>
                      </div>
                      {row.item_id && (
                        <p className="text-xs text-[#8b95a5]">
                          {row.loadingAvailability ? (
                            <span className="inline-flex items-center gap-1">
                              <Loader2 className="size-3 animate-spin" />
                              Checking available stock...
                            </span>
                          ) : row.available_quantity != null ? (
                            <>
                              Available at source:{" "}
                              <span className="font-medium text-[#373B44]">
                                {formatQuantity(row.available_quantity)}
                                {selectedUnit ? ` ${selectedUnit.name}` : ""}
                              </span>
                            </>
                          ) : (
                            "Available stock could not be loaded"
                          )}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            {formError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {formError}
              </p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
