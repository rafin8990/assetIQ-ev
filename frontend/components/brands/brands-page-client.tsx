"use client"

import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
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
import {
  createBrand,
  deleteBrand,
  getBrands,
  updateBrand,
} from "@/services/brands"
import type { Brand } from "@/types/brands"

type FormMode = "create" | "edit"

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function normalizeOptional(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function BrandsPageClient() {
  const [brands, setBrands] = React.useState<Brand[]>([])
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [appliedSearch, setAppliedSearch] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [formError, setFormError] = React.useState<string | null>(null)

  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [formMode, setFormMode] = React.useState<FormMode>("create")
  const [selectedBrand, setSelectedBrand] = React.useState<Brand | null>(null)
  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [image, setImage] = React.useState("")

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [brandToDelete, setBrandToDelete] = React.useState<Brand | null>(null)

  const fetchBrands = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getBrands({
        page,
        limit: 10,
        sortBy: "created_at",
        sortOrder: "desc",
        searchTerm: appliedSearch || undefined,
      })

      setBrands(result.data)
      setTotal(result.meta?.total ?? 0)
      setTotalPages(result.meta?.totalPages ?? 1)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load brands"
      setError(message)
      setBrands([])
    } finally {
      setIsLoading(false)
    }
  }, [appliedSearch, page])

  React.useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

  const openCreateSheet = () => {
    setFormMode("create")
    setSelectedBrand(null)
    setName("")
    setSlug("")
    setImage("")
    setFormError(null)
    setSheetOpen(true)
  }

  const openEditSheet = (brand: Brand) => {
    setFormMode("edit")
    setSelectedBrand(brand)
    setName(brand.name)
    setSlug(brand.slug ?? "")
    setImage(brand.image ?? "")
    setFormError(null)
    setSheetOpen(true)
  }

  const openDeleteSheet = (brand: Brand) => {
    setBrandToDelete(brand)
    setFormError(null)
    setDeleteOpen(true)
  }

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    setPage(1)
    setAppliedSearch(searchTerm.trim())
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      setFormError("Name is required")
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      if (formMode === "create") {
        await createBrand({
          name: trimmedName,
          slug: normalizeOptional(slug),
          image: normalizeOptional(image),
        })
      } else if (selectedBrand) {
        await updateBrand(selectedBrand.id, {
          name: trimmedName,
          slug: normalizeOptional(slug),
          image: normalizeOptional(image),
        })
      }

      setSheetOpen(false)
      await fetchBrands()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.errorMessages?.[0]?.message || err.message
          : err instanceof Error
            ? err.message
            : "Failed to save brand"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!brandToDelete) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await deleteBrand(brandToDelete.id)
      setDeleteOpen(false)
      setBrandToDelete(null)

      if (brands.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await fetchBrands()
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to delete brand"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#373B44]">
            Brand
          </h2>
          <p className="text-[#8b95a5]">
            Manage asset brands and manufacturers.
          </p>
        </div>
        <Button onClick={openCreateSheet} className="shrink-0">
          <Plus data-icon="inline-start" />
          Add Brand
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
        <div className="border-b border-[#e8eaed] bg-gradient-to-r from-[#373B44] to-[#4a4f5c] px-5 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Tag className="size-5 text-[#4DC591]" />
              <div>
                <h3 className="text-base font-semibold text-white">
                  All Brands
                </h3>
                <p className="text-sm text-white/70">
                  {total} brand{total === 1 ? "" : "s"} total
                </p>
              </div>
            </div>

            <form onSubmit={handleSearch} className="flex w-full max-w-sm gap-2">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8b95a5]" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name or slug..."
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
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e8eaed] bg-[#f8f9fb]">
                <th className="px-5 py-3 font-semibold text-[#373B44]">ID</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Name
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Slug
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Image
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Created At
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Updated At
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
                    colSpan={7}
                    className="px-5 py-10 text-center text-[#8b95a5]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading brands...
                    </span>
                  </td>
                </tr>
              ) : brands.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-[#8b95a5]"
                  >
                    No brands found. Create your first brand to get started.
                  </td>
                </tr>
              ) : (
                brands.map((brand) => (
                  <tr
                    key={brand.id}
                    className="transition-colors hover:bg-[#f8f9fb]"
                  >
                    <td className="px-5 py-3.5 font-medium text-[#373B44]">
                      {brand.id}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#373B44]">
                      {brand.name}
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {brand.slug ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {brand.image ? (
                        <a
                          href={brand.image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[#4DC591] hover:underline"
                        >
                          <img
                            src={brand.image}
                            alt={brand.name}
                            className="size-8 rounded border border-[#e8eaed] object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = "none"
                            }}
                          />
                          <span className="max-w-[140px] truncate">View</span>
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[#8b95a5]">
                      {formatDate(brand.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-[#8b95a5]">
                      {formatDate(brand.updated_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditSheet(brand)}
                        >
                          <Pencil />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteSheet(brand)}
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
              onClick={() => setPage((current) => current - 1)}
            >
              <ChevronLeft />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {formMode === "create" ? "Add Brand" : "Edit Brand"}
            </SheetTitle>
            <SheetDescription>
              {formMode === "create"
                ? "Create a new asset brand."
                : "Update the brand details."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-4">
            <div className="space-y-2">
              <label
                htmlFor="brand-name"
                className="text-sm font-medium text-[#373B44]"
              >
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="brand-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Samsung"
                maxLength={255}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="brand-slug"
                className="text-sm font-medium text-[#373B44]"
              >
                Slug
              </label>
              <Input
                id="brand-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="e.g. samsung (optional)"
                maxLength={255}
                disabled={isSubmitting}
              />
              <p className="text-xs text-[#8b95a5]">
                Leave empty if no slug is needed.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="brand-image"
                className="text-sm font-medium text-[#373B44]"
              >
                Image URL
              </label>
              <Input
                id="brand-image"
                value={image}
                onChange={(event) => setImage(event.target.value)}
                placeholder="https://example.com/logo.png (optional)"
                maxLength={2048}
                disabled={isSubmitting}
              />
              <p className="text-xs text-[#8b95a5]">
                Paste an image URL for the brand logo.
              </p>
            </div>

            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}

            <SheetFooter className="px-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                {formMode === "create" ? "Create Brand" : "Save Changes"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Delete Brand</SheetTitle>
            <SheetDescription>
              This action cannot be undone. The brand will be permanently
              removed.
            </SheetDescription>
          </SheetHeader>

          <div className="px-4">
            <p className="text-sm text-[#5c6370]">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#373B44]">
                {brandToDelete?.name}
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
              Delete Brand
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
