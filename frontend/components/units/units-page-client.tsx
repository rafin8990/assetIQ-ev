"use client"

import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Ruler,
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
  createUnit,
  deleteUnit,
  getUnits,
  updateUnit,
} from "@/services/units"
import type { Unit } from "@/types/units"

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

export function UnitsPageClient() {
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

  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [formMode, setFormMode] = React.useState<FormMode>("create")
  const [selectedUnit, setSelectedUnit] = React.useState<Unit | null>(null)
  const [name, setName] = React.useState("")

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [unitToDelete, setUnitToDelete] = React.useState<Unit | null>(null)

  const fetchUnits = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getUnits({
        page,
        limit: 10,
        sortBy: "created_at",
        sortOrder: "desc",
        searchTerm: appliedSearch || undefined,
      })

      setUnits(result.data)
      setTotal(result.meta?.total ?? 0)
      setTotalPages(result.meta?.totalPages ?? 1)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load units"
      setError(message)
      setUnits([])
    } finally {
      setIsLoading(false)
    }
  }, [appliedSearch, page])

  React.useEffect(() => {
    fetchUnits()
  }, [fetchUnits])

  const openCreateSheet = () => {
    setFormMode("create")
    setSelectedUnit(null)
    setName("")
    setFormError(null)
    setSheetOpen(true)
  }

  const openEditSheet = (unit: Unit) => {
    setFormMode("edit")
    setSelectedUnit(unit)
    setName(unit.name)
    setFormError(null)
    setSheetOpen(true)
  }

  const openDeleteSheet = (unit: Unit) => {
    setUnitToDelete(unit)
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
        await createUnit({ name: trimmedName })
      } else if (selectedUnit) {
        await updateUnit(selectedUnit.id, { name: trimmedName })
      }

      setSheetOpen(false)
      await fetchUnits()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.errorMessages?.[0]?.message || err.message
          : err instanceof Error
            ? err.message
            : "Failed to save unit"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!unitToDelete) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await deleteUnit(unitToDelete.id)
      setDeleteOpen(false)
      setUnitToDelete(null)

      if (units.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await fetchUnits()
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to delete unit"
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
            Units
          </h2>
          <p className="text-[#8b95a5]">
            Manage measurement units for assets and inventory.
          </p>
        </div>
        <Button onClick={openCreateSheet} className="shrink-0">
          <Plus data-icon="inline-start" />
          Add Unit
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
        <div className="border-b border-[#e8eaed] bg-gradient-to-r from-[#373B44] to-[#4a4f5c] px-5 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Ruler className="size-5 text-[#4DC591]" />
              <div>
                <h3 className="text-base font-semibold text-white">All Units</h3>
                <p className="text-sm text-white/70">
                  {total} unit{total === 1 ? "" : "s"} total
                </p>
              </div>
            </div>

            <form onSubmit={handleSearch} className="flex w-full max-w-sm gap-2">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8b95a5]" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name..."
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
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e8eaed] bg-[#f8f9fb]">
                <th className="px-5 py-3 font-semibold text-[#373B44]">ID</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Name
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
                    colSpan={5}
                    className="px-5 py-10 text-center text-[#8b95a5]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading units...
                    </span>
                  </td>
                </tr>
              ) : units.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-[#8b95a5]"
                  >
                    No units found. Create your first unit to get started.
                  </td>
                </tr>
              ) : (
                units.map((unit) => (
                  <tr
                    key={unit.id}
                    className="transition-colors hover:bg-[#f8f9fb]"
                  >
                    <td className="px-5 py-3.5 font-medium text-[#373B44]">
                      {unit.id}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#373B44]">
                      {unit.name}
                    </td>
                    <td className="px-5 py-3.5 text-[#8b95a5]">
                      {formatDate(unit.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-[#8b95a5]">
                      {formatDate(unit.updated_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditSheet(unit)}
                        >
                          <Pencil />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteSheet(unit)}
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
              {formMode === "create" ? "Add Unit" : "Edit Unit"}
            </SheetTitle>
            <SheetDescription>
              {formMode === "create"
                ? "Create a new measurement unit."
                : "Update the unit name."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-4">
            <div className="space-y-2">
              <label
                htmlFor="unit-name"
                className="text-sm font-medium text-[#373B44]"
              >
                Name
              </label>
              <Input
                id="unit-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. kg, liter, piece"
                maxLength={255}
                disabled={isSubmitting}
              />
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
                {formMode === "create" ? "Create Unit" : "Save Changes"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Delete Unit</SheetTitle>
            <SheetDescription>
              This action cannot be undone. The unit will be permanently
              removed.
            </SheetDescription>
          </SheetHeader>

          <div className="px-4">
            <p className="text-sm text-[#5c6370]">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#373B44]">
                {unitToDelete?.name}
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
              Delete Unit
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
