"use client"

import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Loader2,
  Pencil,
  Plus,
  Search,
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
import { getCategories } from "@/services/categories"
import {
  createSubCategory,
  deleteSubCategory,
  getSubCategories,
  updateSubCategory,
} from "@/services/sub-categories"
import type { Category } from "@/types/categories"
import type { SubCategory } from "@/types/sub-categories"

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

function normalizeSlug(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function SubCategoriesPageClient() {
  const [subCategories, setSubCategories] = React.useState<SubCategory[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [appliedSearch, setAppliedSearch] = React.useState("")
  const [filterCategoryId, setFilterCategoryId] = React.useState("")
  const [appliedCategoryId, setAppliedCategoryId] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [formError, setFormError] = React.useState<string | null>(null)

  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [formMode, setFormMode] = React.useState<FormMode>("create")
  const [selectedSubCategory, setSelectedSubCategory] =
    React.useState<SubCategory | null>(null)
  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("")

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [subCategoryToDelete, setSubCategoryToDelete] =
    React.useState<SubCategory | null>(null)

  const fetchCategories = React.useCallback(async () => {
    try {
      const result = await getCategories({ limit: 100, sortBy: "name", sortOrder: "asc" })
      setCategories(result.data)
    } catch {
      setCategories([])
    }
  }, [])

  const fetchSubCategories = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getSubCategories({
        page,
        limit: 10,
        sortBy: "created_at",
        sortOrder: "desc",
        searchTerm: appliedSearch || undefined,
        categoryId: appliedCategoryId
          ? Number(appliedCategoryId)
          : undefined,
      })

      setSubCategories(result.data)
      setTotal(result.meta?.total ?? 0)
      setTotalPages(result.meta?.totalPages ?? 1)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load sub categories"
      setError(message)
      setSubCategories([])
    } finally {
      setIsLoading(false)
    }
  }, [appliedCategoryId, appliedSearch, page])

  React.useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  React.useEffect(() => {
    fetchSubCategories()
  }, [fetchSubCategories])

  const openCreateSheet = () => {
    setFormMode("create")
    setSelectedSubCategory(null)
    setName("")
    setSlug("")
    setCategoryId(categories[0] ? String(categories[0].id) : "")
    setFormError(null)
    setSheetOpen(true)
  }

  const openEditSheet = (subCategory: SubCategory) => {
    setFormMode("edit")
    setSelectedSubCategory(subCategory)
    setName(subCategory.name)
    setSlug(subCategory.slug ?? "")
    setCategoryId(String(subCategory.category_id))
    setFormError(null)
    setSheetOpen(true)
  }

  const openDeleteSheet = (subCategory: SubCategory) => {
    setSubCategoryToDelete(subCategory)
    setFormError(null)
    setDeleteOpen(true)
  }

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    setPage(1)
    setAppliedSearch(searchTerm.trim())
    setAppliedCategoryId(filterCategoryId)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      setFormError("Name is required")
      return
    }

    if (!categoryId) {
      setFormError("Category is required")
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      const payload = {
        name: trimmedName,
        slug: normalizeSlug(slug),
        category_id: Number(categoryId),
      }

      if (formMode === "create") {
        await createSubCategory(payload)
      } else if (selectedSubCategory) {
        await updateSubCategory(selectedSubCategory.id, payload)
      }

      setSheetOpen(false)
      await fetchSubCategories()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.errorMessages?.[0]?.message || err.message
          : err instanceof Error
            ? err.message
            : "Failed to save sub category"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!subCategoryToDelete) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await deleteSubCategory(subCategoryToDelete.id)
      setDeleteOpen(false)
      setSubCategoryToDelete(null)

      if (subCategories.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await fetchSubCategories()
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to delete sub category"
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
            Sub category
          </h2>
          <p className="text-[#8b95a5]">
            Manage sub categories under each asset category.
          </p>
        </div>
        <Button
          onClick={openCreateSheet}
          className="shrink-0"
          disabled={categories.length === 0}
        >
          <Plus data-icon="inline-start" />
          Add Sub Category
        </Button>
      </div>

      {categories.length === 0 && !isLoading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Create at least one category before adding sub categories.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
        <div className="border-b border-[#e8eaed] bg-gradient-to-r from-[#373B44] to-[#4a4f5c] px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="size-5 text-[#4DC591]" />
              <div>
                <h3 className="text-base font-semibold text-white">
                  All Sub Categories
                </h3>
                <p className="text-sm text-white/70">
                  {total} sub categor{total === 1 ? "y" : "ies"} total
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSearch}
              className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-2xl"
            >
              <select
                value={filterCategoryId}
                onChange={(event) => setFilterCategoryId(event.target.value)}
                className="h-9 rounded-lg border border-[#e8eaed] bg-white px-3 text-sm text-[#373B44] outline-none focus:border-[#4DC591] focus:ring-2 focus:ring-[#4DC591]/20"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8b95a5]" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name, slug, or category..."
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
                  Category
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
                      Loading sub categories...
                    </span>
                  </td>
                </tr>
              ) : subCategories.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-[#8b95a5]"
                  >
                    No sub categories found. Create your first sub category to
                    get started.
                  </td>
                </tr>
              ) : (
                subCategories.map((subCategory) => (
                  <tr
                    key={subCategory.id}
                    className="transition-colors hover:bg-[#f8f9fb]"
                  >
                    <td className="px-5 py-3.5 font-medium text-[#373B44]">
                      {subCategory.id}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#373B44]">
                      {subCategory.name}
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {subCategory.slug ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {subCategory.category_name ?? subCategory.category_id}
                    </td>
                    <td className="px-5 py-3.5 text-[#8b95a5]">
                      {formatDate(subCategory.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-[#8b95a5]">
                      {formatDate(subCategory.updated_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditSheet(subCategory)}
                        >
                          <Pencil />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteSheet(subCategory)}
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
              {formMode === "create" ? "Add Sub Category" : "Edit Sub Category"}
            </SheetTitle>
            <SheetDescription>
              {formMode === "create"
                ? "Create a new sub category under a parent category."
                : "Update the sub category details."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-4">
            <div className="space-y-2">
              <label
                htmlFor="sub-category-name"
                className="text-sm font-medium text-[#373B44]"
              >
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="sub-category-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Laptops"
                maxLength={255}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="sub-category-slug"
                className="text-sm font-medium text-[#373B44]"
              >
                Slug
              </label>
              <Input
                id="sub-category-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="e.g. laptops (optional)"
                maxLength={255}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="sub-category-category"
                className="text-sm font-medium text-[#373B44]"
              >
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="sub-category-category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                disabled={isSubmitting}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
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
                {formMode === "create" ? "Create Sub Category" : "Save Changes"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Delete Sub Category</SheetTitle>
            <SheetDescription>
              This action cannot be undone. The sub category will be permanently
              removed.
            </SheetDescription>
          </SheetHeader>

          <div className="px-4">
            <p className="text-sm text-[#5c6370]">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#373B44]">
                {subCategoryToDelete?.name}
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
              Delete Sub Category
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
