"use client"

import * as React from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react"

import { ItemFormModal } from "@/components/items/item-form-modal"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ApiError } from "@/lib/api/client"
import { getBrands } from "@/services/brands"
import { getCategories } from "@/services/categories"
import {
  bulkImportItems,
  deleteItem,
  downloadItemsImportTemplate,
  getItem,
  getItems,
} from "@/services/items"
import { getSubCategories } from "@/services/sub-categories"
import { getUnits } from "@/services/units"
import type { Brand } from "@/types/brands"
import type { Category } from "@/types/categories"
import type { BulkImportResult, Item } from "@/types/items"
import type { SubCategory } from "@/types/sub-categories"
import type { Unit } from "@/types/units"

const selectClassName =
  "flex h-9 w-full rounded-md border border-[#e8eaed] bg-white px-3 py-1 text-sm text-[#373B44] outline-none focus:border-[#4DC591] focus:ring-2 focus:ring-[#4DC591]/20"

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ItemsPageClient() {
  const [items, setItems] = React.useState<Item[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [subCategories, setSubCategories] = React.useState<SubCategory[]>([])
  const [brands, setBrands] = React.useState<Brand[]>([])
  const [units, setUnits] = React.useState<Unit[]>([])

  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [appliedSearch, setAppliedSearch] = React.useState("")
  const [filterCategoryId, setFilterCategoryId] = React.useState("")
  const [filterBrandId, setFilterBrandId] = React.useState("")
  const [appliedCategoryId, setAppliedCategoryId] = React.useState("")
  const [appliedBrandId, setAppliedBrandId] = React.useState("")

  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [formError, setFormError] = React.useState<string | null>(null)

  const [formOpen, setFormOpen] = React.useState(false)
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create")
  const [selectedItem, setSelectedItem] = React.useState<Item | null>(null)

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [itemToDelete, setItemToDelete] = React.useState<Item | null>(null)

  const [importOpen, setImportOpen] = React.useState(false)
  const [importFile, setImportFile] = React.useState<File | null>(null)
  const [importResult, setImportResult] = React.useState<BulkImportResult | null>(
    null
  )

  const fetchLookups = React.useCallback(async () => {
    try {
      const [categoriesRes, subCategoriesRes, brandsRes, unitsRes] =
        await Promise.all([
          getCategories({ limit: 100, sortBy: "name", sortOrder: "asc" }),
          getSubCategories({ limit: 100, sortBy: "name", sortOrder: "asc" }),
          getBrands({ limit: 100, sortBy: "name", sortOrder: "asc" }),
          getUnits({ limit: 100, sortBy: "name", sortOrder: "asc" }),
        ])

      setCategories(categoriesRes.data)
      setSubCategories(subCategoriesRes.data)
      setBrands(brandsRes.data)
      setUnits(unitsRes.data)
    } catch {
      setCategories([])
      setSubCategories([])
      setBrands([])
      setUnits([])
    }
  }, [])

  const fetchItems = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getItems({
        page,
        limit: 10,
        sortBy: "created_at",
        sortOrder: "desc",
        searchTerm: appliedSearch || undefined,
        categoryId: appliedCategoryId ? Number(appliedCategoryId) : undefined,
        brandId: appliedBrandId ? Number(appliedBrandId) : undefined,
      })

      setItems(result.data)
      setTotal(result.meta?.total ?? 0)
      setTotalPages(result.meta?.totalPages ?? 1)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load items"
      setError(message)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [appliedBrandId, appliedCategoryId, appliedSearch, page])

  React.useEffect(() => {
    fetchLookups()
  }, [fetchLookups])

  React.useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const openCreateModal = () => {
    setFormMode("create")
    setSelectedItem(null)
    setFormOpen(true)
  }

  const openEditModal = async (item: Item) => {
    setFormMode("edit")
    setFormError(null)

    try {
      const fullItem = await getItem(item.id)
      setSelectedItem(fullItem)
      setFormOpen(true)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load item for editing"
      setError(message)
    }
  }

  const openDeleteSheet = (item: Item) => {
    setItemToDelete(item)
    setFormError(null)
    setDeleteOpen(true)
  }

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    setPage(1)
    setAppliedSearch(searchTerm.trim())
    setAppliedCategoryId(filterCategoryId)
    setAppliedBrandId(filterBrandId)
  }

  const handleDelete = async () => {
    if (!itemToDelete) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await deleteItem(itemToDelete.id)
      setDeleteOpen(false)
      setItemToDelete(null)

      if (items.length === 1 && page > 1) {
        setPage(current => current - 1)
      } else {
        await fetchItems()
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to delete item"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      setFormError("Please select an Excel file")
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      const result = await bulkImportItems(importFile)
      setImportResult(result)
      await fetchItems()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to import items"
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#373B44]">
            Items
          </h2>
          <p className="text-[#8b95a5]">
            Manage inventory items, photos, and bulk imports.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={openImportModal}>
            <FileSpreadsheet data-icon="inline-start" />
            Import Excel
          </Button>
          <Button onClick={openCreateModal}>
            <Plus data-icon="inline-start" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
        <div className="border-b border-[#e8eaed] bg-gradient-to-r from-[#373B44] to-[#4a4f5c] px-5 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Package className="size-5 text-[#4DC591]" />
              <div>
                <h3 className="text-base font-semibold text-white">
                  All Items
                </h3>
                <p className="text-sm text-white/70">
                  {total} item{total === 1 ? "" : "s"} total
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSearch}
              className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
            >
              <div className="relative lg:col-span-2">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8b95a5]" />
                <Input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search by name, model, type..."
                  className="h-9 border-[#e8eaed] bg-white pl-9"
                />
              </div>
              <select
                value={filterCategoryId}
                onChange={e => setFilterCategoryId(e.target.value)}
                className={selectClassName}
              >
                <option value="">All categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <select
                value={filterBrandId}
                onChange={e => setFilterBrandId(e.target.value)}
                className={selectClassName}
              >
                <option value="">All brands</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="outline" className="bg-white lg:col-span-4 lg:ml-auto lg:w-auto">
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
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e8eaed] bg-[#f8f9fb]">
                <th className="px-5 py-3 font-semibold text-[#373B44]">ID</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Item</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Category</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Brand</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Model</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Unit</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Low Stock</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Created</th>
                <th className="px-5 py-3 text-right font-semibold text-[#373B44]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8eaed]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-[#8b95a5]">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading items...
                    </span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-[#8b95a5]">
                    No items found. Create your first item or import from Excel.
                  </td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="transition-colors hover:bg-[#f8f9fb]">
                    <td className="px-5 py-3.5 font-medium text-[#373B44]">
                      {item.id}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-10 overflow-hidden rounded-lg border border-[#e8eaed] bg-[#f8f9fb]">
                          {/* images not in list response - show placeholder */}
                          <div className="flex size-full items-center justify-center text-[#8b95a5]">
                            <Package className="size-4" />
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-[#373B44]">{item.name}</p>
                          <p className="text-xs text-[#8b95a5]">
                            {item.type ?? "No type"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {item.category_name ?? "—"}
                      {item.sub_category_name && (
                        <span className="block text-xs text-[#8b95a5]">
                          {item.sub_category_name}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {item.brand_name ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {item.model ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {item.unit_name ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {item.low_stock_amount ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-[#8b95a5]">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/assets/items/${item.id}`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" })
                          )}
                        >
                          <Eye />
                          View
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(item)}
                        >
                          <Pencil />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteSheet(item)}
                        >
                          <Trash2 />
                          Delete
                        </Button>
                      </div>
                    </td>
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

      <ItemFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        item={selectedItem}
        categories={categories}
        subCategories={subCategories}
        brands={brands}
        units={units}
        onSuccess={fetchItems}
      />

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Items from Excel</DialogTitle>
            <DialogDescription>
              Upload an Excel file (.xlsx, .xls) to bulk create items.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <div className="rounded-lg border border-[#e8eaed] bg-[#f8f9fb] p-4">
              <p className="text-sm text-[#5c6370]">
                Download the template, fill in your item data, then upload the file.
              </p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => downloadItemsImportTemplate()}
              >
                <Download />
                Download Template
              </Button>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#d5dae1] bg-white px-6 py-8 text-center transition-colors hover:border-[#4DC591] hover:bg-[#f8f9fb]">
              <Upload className="size-8 text-[#8b95a5]" />
              <span className="text-sm font-medium text-[#373B44]">
                {importFile ? importFile.name : "Choose Excel file"}
              </span>
              <span className="text-xs text-[#8b95a5]">
                .xlsx or .xls up to 10MB
              </span>
              <input
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                onChange={e => setImportFile(e.target.files?.[0] ?? null)}
              />
            </label>

            {importResult && (
              <div className="rounded-lg border border-[#e8eaed] bg-[#f8f9fb] p-4 text-sm">
                <p className="font-medium text-[#373B44]">
                  Import complete: {importResult.created} created,{" "}
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

            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportOpen(false)}
              disabled={isSubmitting}
            >
              Close
            </Button>
            <Button onClick={handleImport} disabled={isSubmitting || !importFile}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Upload & Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Delete Item</SheetTitle>
            <SheetDescription>
              This action cannot be undone. The item and all photos will be
              permanently removed.
            </SheetDescription>
          </SheetHeader>

          <div className="px-4">
            <p className="text-sm text-[#5c6370]">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#373B44]">
                {itemToDelete?.name}
              </span>
              ?
            </p>

            {formError && (
              <p className="mt-3 text-sm text-red-600">{formError}</p>
            )}
          </div>

          <SheetFooter className="px-4">
            <Button
              type="button"
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
              Delete Item
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
