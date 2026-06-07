"use client"

import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  FolderTree,
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
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/services/categories"
import type { Category } from "@/types/categories"

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

export function CategoriesPageClient() {
  const [categories, setCategories] = React.useState<Category[]>([])
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
  const [selectedCategory, setSelectedCategory] =
    React.useState<Category | null>(null)
  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [categoryToDelete, setCategoryToDelete] =
    React.useState<Category | null>(null)

  const fetchCategories = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getCategories({
        page,
        limit: 10,
        sortBy: "created_at",
        sortOrder: "desc",
        searchTerm: appliedSearch || undefined,
      })

      setCategories(result.data)
      setTotal(result.meta?.total ?? 0)
      setTotalPages(result.meta?.totalPages ?? 1)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load categories"
      setError(message)
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }, [appliedSearch, page])

  React.useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const openCreateSheet = () => {
    setFormMode("create")
    setSelectedCategory(null)
    setName("")
    setSlug("")
    setFormError(null)
    setSheetOpen(true)
  }

  const openEditSheet = (category: Category) => {
    setFormMode("edit")
    setSelectedCategory(category)
    setName(category.name)
    setSlug(category.slug ?? "")
    setFormError(null)
    setSheetOpen(true)
  }

  const openDeleteSheet = (category: Category) => {
    setCategoryToDelete(category)
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
        await createCategory({
          name: trimmedName,
          slug: normalizeSlug(slug),
        })
      } else if (selectedCategory) {
        await updateCategory(selectedCategory.id, {
          name: trimmedName,
          slug: normalizeSlug(slug),
        })
      }

      setSheetOpen(false)
      await fetchCategories()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.errorMessages?.[0]?.message || err.message
          : err instanceof Error
            ? err.message
            : "Failed to save category"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!categoryToDelete) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await deleteCategory(categoryToDelete.id)
      setDeleteOpen(false)
      setCategoryToDelete(null)

      if (categories.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await fetchCategories()
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to delete category"
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
            Category
          </h2>
          <p className="text-[#8b95a5]">
            Manage asset categories and classifications.
          </p>
        </div>
        <Button onClick={openCreateSheet} className="shrink-0">
          <Plus data-icon="inline-start" />
          Add Category
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
        <div className="border-b border-[#e8eaed] bg-gradient-to-r from-[#373B44] to-[#4a4f5c] px-5 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <FolderTree className="size-5 text-[#4DC591]" />
              <div>
                <h3 className="text-base font-semibold text-white">
                  All Categories
                </h3>
                <p className="text-sm text-white/70">
                  {total} categor{total === 1 ? "y" : "ies"} total
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
          <table className="w-full min-w-[860px] text-left text-sm">
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
                    colSpan={6}
                    className="px-5 py-10 text-center text-[#8b95a5]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading categories...
                    </span>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-[#8b95a5]"
                  >
                    No categories found. Create your first category to get
                    started.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr
                    key={category.id}
                    className="transition-colors hover:bg-[#f8f9fb]"
                  >
                    <td className="px-5 py-3.5 font-medium text-[#373B44]">
                      {category.id}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#373B44]">
                      {category.name}
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {category.slug ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-[#8b95a5]">
                      {formatDate(category.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-[#8b95a5]">
                      {formatDate(category.updated_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditSheet(category)}
                        >
                          <Pencil />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteSheet(category)}
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
              {formMode === "create" ? "Add Category" : "Edit Category"}
            </SheetTitle>
            <SheetDescription>
              {formMode === "create"
                ? "Create a new asset category."
                : "Update the category details."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-4">
            <div className="space-y-2">
              <label
                htmlFor="category-name"
                className="text-sm font-medium text-[#373B44]"
              >
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="category-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Electronics"
                maxLength={255}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="category-slug"
                className="text-sm font-medium text-[#373B44]"
              >
                Slug
              </label>
              <Input
                id="category-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="e.g. electronics (optional)"
                maxLength={255}
                disabled={isSubmitting}
              />
              <p className="text-xs text-[#8b95a5]">
                Leave empty if no slug is needed.
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
                {formMode === "create" ? "Create Category" : "Save Changes"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Delete Category</SheetTitle>
            <SheetDescription>
              This action cannot be undone. The category will be permanently
              removed.
            </SheetDescription>
          </SheetHeader>

          <div className="px-4">
            <p className="text-sm text-[#5c6370]">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#373B44]">
                {categoryToDelete?.name}
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
              Delete Category
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
