"use client"

import * as React from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
  Plus,
  Search,
  Warehouse,
} from "lucide-react"

import {
  canManageStock,
  formatQuantity,
  formatVendorDisplay,
  selectClassName,
} from "@/components/inventory/inventory-constants"
import { Button } from "@/components/ui/button"
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
import {
  addManualLot,
  getLocationStock,
  getStockLots,
} from "@/services/inventory"
import { getItems } from "@/services/items"
import { getLocations } from "@/services/locations"
import { getUnits } from "@/services/units"
import { getVendors } from "@/services/vendors"
import type { LocationStockRow, StockLot } from "@/types/inventory"
import type { Item } from "@/types/items"
import type { Location } from "@/types/locations"
import type { Unit } from "@/types/units"
import type { Vendor } from "@/types/vendors"

type RowKey = string

function rowKey(row: LocationStockRow): RowKey {
  return `${row.location_id}-${row.item_id}-${row.vendor_id ?? "null"}`
}

export function LocationStockPageClient() {
  const authUser = getAuthUser()
  const canManage = canManageStock(authUser)

  const [locations, setLocations] = React.useState<Location[]>([])
  const [items, setItems] = React.useState<Item[]>([])
  const [units, setUnits] = React.useState<Unit[]>([])
  const [vendors, setVendors] = React.useState<Vendor[]>([])
  const [rows, setRows] = React.useState<LocationStockRow[]>([])
  const [locationId, setLocationId] = React.useState("")
  const [vendorFilter, setVendorFilter] = React.useState("")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [appliedSearch, setAppliedSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [expanded, setExpanded] = React.useState<Record<RowKey, boolean>>({})
  const [lotsCache, setLotsCache] = React.useState<Record<RowKey, StockLot[]>>({})
  const [lotsLoading, setLotsLoading] = React.useState<Record<RowKey, boolean>>(
    {}
  )

  const [addOpen, setAddOpen] = React.useState(false)
  const [addItemId, setAddItemId] = React.useState("")
  const [addVendorId, setAddVendorId] = React.useState("")
  const [addQty, setAddQty] = React.useState("")
  const [addUnitId, setAddUnitId] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function loadLookups() {
      try {
        const [locRes, itemRes, unitRes, vendorRes] = await Promise.all([
          getLocations({ limit: 200, sortBy: "name", sortOrder: "asc" }),
          getItems({ limit: 200, sortBy: "name", sortOrder: "asc" }),
          getUnits({ limit: 100, sortBy: "name", sortOrder: "asc" }),
          getVendors({ limit: 200, sortBy: "vendor_name", sortOrder: "asc" }),
        ])
        setLocations(locRes.data)
        setItems(itemRes.data)
        setUnits(unitRes.data)
        setVendors(vendorRes.data)
      } catch {
        setLocations([])
        setItems([])
        setUnits([])
        setVendors([])
      }
    }

    loadLookups()
  }, [])

  const fetchStock = React.useCallback(async () => {
    if (!locationId) {
      setRows([])
      setTotal(0)
      setTotalPages(1)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await getLocationStock({
        page,
        limit: 10,
        locationId: Number(locationId),
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
            : "Failed to load location stock"
      setError(message)
      setRows([])
    } finally {
      setIsLoading(false)
    }
  }, [appliedSearch, locationId, page, vendorFilter])

  React.useEffect(() => {
    fetchStock()
  }, [fetchStock])

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    setPage(1)
    setAppliedSearch(searchTerm.trim())
  }

  const toggleExpand = async (row: LocationStockRow) => {
    const key = rowKey(row)
    const next = !expanded[key]
    setExpanded(current => ({ ...current, [key]: next }))

    if (next && !lotsCache[key]) {
      setLotsLoading(current => ({ ...current, [key]: true }))
      try {
        const lots = await getStockLots({
          locationId: row.location_id,
          itemId: row.item_id,
          vendorId: row.vendor_id ?? undefined,
        })
        setLotsCache(current => ({ ...current, [key]: lots }))
      } catch {
        setLotsCache(current => ({ ...current, [key]: [] }))
      } finally {
        setLotsLoading(current => ({ ...current, [key]: false }))
      }
    }
  }

  const handleAddLot = async () => {
    if (!locationId || !addItemId || !addQty) {
      setFormError("Location, item, and quantity are required")
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      await addManualLot({
        location_id: Number(locationId),
        item_id: Number(addItemId),
        vendor_id: addVendorId ? Number(addVendorId) : null,
        quantity: Number(addQty),
        unit_id: addUnitId ? Number(addUnitId) : null,
      })
      setAddOpen(false)
      setAddItemId("")
      setAddVendorId("")
      setAddQty("")
      setAddUnitId("")
      setExpanded({})
      setLotsCache({})
      fetchStock()
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to add stock"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddItemChange = (itemId: string) => {
    const selectedItem = items.find(item => item.id === Number(itemId))
    setAddItemId(itemId)
    setAddUnitId(selectedItem?.unit_id ? String(selectedItem.unit_id) : "")
  }

  const selectedLocation = locations.find(
    location => location.id === Number(locationId)
  )

  React.useEffect(() => {
    if (!addOpen) {
      setAddItemId("")
      setAddVendorId("")
      setAddQty("")
      setAddUnitId("")
      setFormError(null)
    }
  }, [addOpen])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#373B44]">
            Location Stock
          </h1>
          <p className="text-sm text-[#8b95a5]">
            On-hand quantity by location, item, and vendor
          </p>
        </div>
        {canManage && locationId && (
          <Button onClick={() => setAddOpen(true)}>
            <Plus />
            Add Stock
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-[#e8eaed] bg-white p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#373B44]">
              Location *
            </label>
            <select
              value={locationId}
              onChange={event => {
                setLocationId(event.target.value)
                setPage(1)
                setExpanded({})
                setLotsCache({})
              }}
              className={selectClassName}
            >
              <option value="">Select location</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
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
              disabled={!locationId}
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
                disabled={!locationId}
              />
            </div>
            <Button type="submit" variant="outline" disabled={!locationId}>
              <Search />
            </Button>
          </form>
        </div>
      </div>

      <div className="rounded-xl border border-[#e8eaed] bg-white">
        {!locationId ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-[#8b95a5]">
            <Warehouse className="h-10 w-10" />
            <p>Select a location to view stock</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#4DC591]" />
          </div>
        ) : error ? (
          <div className="px-6 py-8 text-sm text-red-600">{error}</div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-[#8b95a5]">
            No stock found at this location
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
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
                    Quantity
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
                            {lotsLoading[key] ? (
                              <Loader2 className="h-5 w-5 animate-spin text-[#4DC591]" />
                            ) : (lotsCache[key] ?? []).length === 0 ? (
                              <p className="text-xs text-[#8b95a5]">
                                No lot details
                              </p>
                            ) : (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-[#8b95a5]">
                                    <th className="pb-2 text-left font-medium">
                                      PO #
                                    </th>
                                    <th className="pb-2 text-left font-medium">
                                      Received
                                    </th>
                                    <th className="pb-2 text-left font-medium">
                                      Remaining
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(lotsCache[key] ?? []).map(lot => (
                                    <tr key={lot.id}>
                                      <td className="py-1 text-[#5c6370]">
                                        {lot.po_number ?? lot.source_type}
                                      </td>
                                      <td className="py-1 text-[#5c6370]">
                                        {new Date(
                                          lot.received_at
                                        ).toLocaleDateString()}
                                      </td>
                                      <td className="py-1 text-[#373B44]">
                                        {formatQuantity(lot.quantity_remaining)}
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

        {locationId && totalPages > 1 && (
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-xl gap-0 p-0">
          <DialogHeader>
            <DialogTitle>Add Stock</DialogTitle>
            <DialogDescription>
              Create a manual stock lot at the selected location.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-6">
            <div className="rounded-lg border border-[#e8eaed] bg-[#f8f9fb] px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[#8b95a5]">
                Location
              </p>
              <p className="mt-1 text-sm font-medium text-[#373B44]">
                {selectedLocation?.name ?? "Selected location"}
              </p>
            </div>

            <div className="space-y-4 rounded-lg border border-[#e8eaed] bg-[#f8f9fb] p-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#373B44]">
                  Item <span className="text-red-500">*</span>
                </label>
                <select
                  value={addItemId}
                  onChange={e => handleAddItemChange(e.target.value)}
                  className={selectClassName}
                  disabled={isSubmitting}
                >
                  <option value="">Select item</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#373B44]">
                  Vendor
                </label>
                <select
                  value={addVendorId}
                  onChange={e => setAddVendorId(e.target.value)}
                  className={selectClassName}
                  disabled={isSubmitting}
                >
                  <option value="">Unknown vendor</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.vendor_name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#8b95a5]">
                  Optional. Leave blank if vendor is not applicable.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#373B44]">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={addQty}
                    onChange={e => setAddQty(e.target.value)}
                    placeholder="Enter quantity"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#373B44]">
                    Unit
                  </label>
                  <select
                    value={addUnitId}
                    onChange={e => setAddUnitId(e.target.value)}
                    className={selectClassName}
                    disabled={isSubmitting}
                  >
                    <option value="">Select unit</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {formError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {formError}
              </p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddLot} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Add Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
