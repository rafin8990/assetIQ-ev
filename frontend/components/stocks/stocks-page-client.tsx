"use client"

import * as React from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react"

import { StockFormModal } from "@/components/stocks/stock-form-modal"
import { canManageStock } from "@/components/stocks/stock-constants"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ApiError } from "@/lib/api/client"
import { getAuthUser } from "@/lib/auth/token"
import { getItems } from "@/services/items"
import {
  bulkImportStock,
  deleteStock,
  downloadStockImportTemplate,
  getStocks,
} from "@/services/stocks"
import { getUnits } from "@/services/units"
import type { Item } from "@/types/items"
import type { BulkStockImportResult, Stock } from "@/types/stocks"
import type { Unit } from "@/types/units"

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(Number(value))
}

export function StocksPageClient() {
  const authUser = getAuthUser()
  const canManage = canManageStock(authUser)

  const [stocks, setStocks] = React.useState<Stock[]>([])
  const [items, setItems] = React.useState<Item[]>([])
  const [units, setUnits] = React.useState<Unit[]>([])
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [appliedSearch, setAppliedSearch] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [formError, setFormError] = React.useState<string | null>(null)

  const [formOpen, setFormOpen] = React.useState(false)
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create")
  const [selectedStock, setSelectedStock] = React.useState<Stock | null>(null)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [stockToDelete, setStockToDelete] = React.useState<Stock | null>(null)
  const [importOpen, setImportOpen] = React.useState(false)
  const [importFile, setImportFile] = React.useState<File | null>(null)
  const [importResult, setImportResult] =
    React.useState<BulkStockImportResult | null>(null)

  const fetchLookups = React.useCallback(async () => {
    if (!canManage) return

    try {
      const [itemsRes, unitsRes] = await Promise.all([
        getItems({ limit: 200, sortBy: "name", sortOrder: "asc" }),
        getUnits({ limit: 100, sortBy: "name", sortOrder: "asc" }),
      ])
      setItems(itemsRes.data)
      setUnits(unitsRes.data)
    } catch {
      setItems([])
      setUnits([])
    }
  }, [canManage])

  const fetchStocks = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getStocks({
        page,
        limit: 10,
        sortBy: "updated_at",
        sortOrder: "desc",
        searchTerm: appliedSearch || undefined,
      })

      setStocks(result.data)
      setTotal(result.meta?.total ?? 0)
      setTotalPages(result.meta?.totalPages ?? 1)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load stock"
      setError(message)
      setStocks([])
    } finally {
      setIsLoading(false)
    }
  }, [appliedSearch, page])

  React.useEffect(() => {
    fetchLookups()
  }, [fetchLookups])

  React.useEffect(() => {
    fetchStocks()
  }, [fetchStocks])

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    setPage(1)
    setAppliedSearch(searchTerm.trim())
  }

  const openCreateModal = () => {
    setFormMode("create")
    setSelectedStock(null)
    setFormOpen(true)
  }

  const openEditModal = (stock: Stock) => {
    setFormMode("edit")
    setSelectedStock(stock)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!stockToDelete) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await deleteStock(stockToDelete.id)
      setDeleteOpen(false)
      setStockToDelete(null)

      if (stocks.length === 1 && page > 1) {
        setPage(current => current - 1)
      } else {
        await fetchStocks()
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to delete stock"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openImportModal = () => {
    setImportFile(null)
    setImportResult(null)
    setFormError(null)
    setImportOpen(true)
  }

  const handleImport = async () => {
    if (!importFile) {
      setFormError("Please select an Excel or CSV file")
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      const result = await bulkImportStock(importFile)
      setImportResult(result)
      await fetchStocks()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to import stock"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalQuantity = stocks.reduce(
    (sum, stock) => sum + Number(stock.quantity),
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#373B44]">
            Stock
          </h2>
          <p className="text-[#8b95a5]">
            Warehouse inventory updated when purchase orders are received.
            {canManage && " You can add stock manually or upload."}
          </p>
        </div>

        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={openImportModal}>
              <FileSpreadsheet />
              Upload Stock
            </Button>
            <Button onClick={openCreateModal}>
              <Plus />
              Add Stock
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[#e8eaed] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#e8f8f0]">
              <Package className="size-5 text-[#4DC591]" />
            </div>
            <div>
              <p className="text-sm text-[#8b95a5]">Stock Lines</p>
              <p className="text-2xl font-bold text-[#373B44]">{total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[#e8eaed] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50">
              <Package className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-[#8b95a5]">Quantity on Page</p>
              <p className="text-2xl font-bold text-[#373B44]">
                {formatQuantity(totalQuantity)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
        <div className="border-b border-[#e8eaed] bg-gradient-to-r from-[#373B44] to-[#4a4f5c] px-5 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Package className="size-5 text-[#4DC591]" />
              <div>
                <h3 className="text-base font-semibold text-white">
                  Inventory Levels
                </h3>
                <p className="text-sm text-white/70">
                  {total} stock line{total === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSearch} className="flex w-full gap-2 sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8b95a5]" />
                <Input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search by item or unit..."
                  className="h-9 border-[#e8eaed] bg-white pl-9"
                />
              </div>
              <Button type="submit" variant="outline" className="bg-white">
                Search
              </Button>
            </form>
          </div>
        </div>

        {error && (
          <div className="border-b border-[#e8eaed] bg-red-50 px-5 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e8eaed] bg-[#f8f9fb]">
                <th className="px-5 py-3 font-semibold text-[#373B44]">Item</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Quantity
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Unit</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Last Updated
                </th>
                {canManage && (
                  <th className="px-5 py-3 text-right font-semibold text-[#373B44]">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8eaed]">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={canManage ? 5 : 4}
                    className="px-5 py-10 text-center text-[#8b95a5]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading stock...
                    </span>
                  </td>
                </tr>
              ) : stocks.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 5 : 4}
                    className="px-5 py-10 text-center text-[#8b95a5]"
                  >
                    No stock records yet. Receive a purchase order
                    {canManage ? " or add stock manually" : ""} to get
                    started.
                  </td>
                </tr>
              ) : (
                stocks.map(stock => (
                  <tr
                    key={stock.id}
                    className="transition-colors hover:bg-[#f8f9fb]"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/assets/items/${stock.item_id}`}
                        className="font-medium text-[#373B44] hover:text-[#4DC591]"
                      >
                        {stock.item_name ?? `Item #${stock.item_id}`}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#373B44]">
                      {formatQuantity(stock.quantity)}
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {stock.unit_name ??
                        (stock.unit_id ? `Unit #${stock.unit_id}` : "—")}
                    </td>
                    <td className="px-5 py-3.5 text-[#8b95a5]">
                      {formatDate(stock.updated_at)}
                    </td>
                    {canManage && (
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(stock)}
                          >
                            <Pencil />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setStockToDelete(stock)
                              setFormError(null)
                              setDeleteOpen(true)
                            }}
                          >
                            <Trash2 />
                            Delete
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#e8eaed] px-5 py-4">
          <p className="text-sm text-[#8b95a5]">
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
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage(current => current + 1)}
            >
              Next
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>

      {canManage && (
        <>
          <StockFormModal
            open={formOpen}
            onOpenChange={setFormOpen}
            mode={formMode}
            stock={selectedStock}
            items={items}
            units={units}
            onSuccess={fetchStocks}
          />

          <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
            <SheetContent side="right" className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Delete Stock</SheetTitle>
                <SheetDescription>
                  Permanently remove this stock line from inventory.
                </SheetDescription>
              </SheetHeader>
              <div className="px-4">
                <p className="text-sm text-[#5c6370]">
                  Delete stock for{" "}
                  <span className="font-semibold text-[#373B44]">
                    {stockToDelete?.item_name ??
                      `Item #${stockToDelete?.item_id}`}
                  </span>
                  ? Current quantity:{" "}
                  <span className="font-semibold text-[#373B44]">
                    {stockToDelete
                      ? formatQuantity(stockToDelete.quantity)
                      : "—"}
                  </span>
                </p>
                {formError && (
                  <p className="mt-3 text-sm text-red-600">{formError}</p>
                )}
              </div>
              <SheetFooter className="px-4">
                <Button
                  variant="outline"
                  onClick={() => setDeleteOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="animate-spin" />}
                  Delete Stock
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload Stock</DialogTitle>
                <DialogDescription>
                  Import stock quantities from Excel or CSV. Each row adds to
                  existing stock or creates a new stock line.
                </DialogDescription>
              </DialogHeader>

              <DialogBody className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => downloadStockImportTemplate()}
                  >
                    <Download />
                    Download Template
                  </Button>
                </div>

                <div className="rounded-lg border border-[#e8eaed] bg-[#f8f9fb] p-3 text-xs text-[#5c6370]">
                  Columns: <strong>item_id</strong>, <strong>quantity</strong>,{" "}
                  <strong>unit_id</strong> (optional)
                </div>

                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#d5dae1] bg-white px-6 py-8 text-center transition-colors hover:border-[#4DC591] hover:bg-[#f8f9fb]">
                  <Upload className="size-8 text-[#8b95a5]" />
                  <span className="text-sm font-medium text-[#373B44]">
                    {importFile ? importFile.name : "Choose Excel or CSV file"}
                  </span>
                  <span className="text-xs text-[#8b95a5]">
                    .xlsx, .xls, or .csv up to 10MB
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                    className="hidden"
                    onChange={e => setImportFile(e.target.files?.[0] ?? null)}
                  />
                </label>

                {importResult && (
                  <div className="rounded-lg border border-[#e8eaed] bg-[#f8f9fb] p-4 text-sm">
                    <p className="font-medium text-[#373B44]">
                      Import complete: {importResult.processed} processed,{" "}
                      {importResult.failed} failed
                    </p>
                    {importResult.errors.length > 0 && (
                      <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-red-600">
                        {importResult.errors.map(errorItem => (
                          <li key={`${errorItem.row}-${errorItem.message}`}>
                            Row {errorItem.row}: {errorItem.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {formError && (
                  <p className="text-sm text-red-600">{formError}</p>
                )}
              </DialogBody>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setImportOpen(false)}
                  disabled={isSubmitting}
                >
                  Close
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={isSubmitting || !importFile}
                >
                  {isSubmitting && <Loader2 className="animate-spin" />}
                  Upload & Import
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
