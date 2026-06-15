"use client"

import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
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
  createLocation,
  deleteLocation,
  getLocations,
  updateLocation,
} from "@/services/locations"
import type { Location } from "@/types/locations"

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

export function LocationsPageClient() {
  const [locations, setLocations] = React.useState<Location[]>([])
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
  const [selectedLocation, setSelectedLocation] = React.useState<Location | null>(
    null
  )
  const [name, setName] = React.useState("")

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [locationToDelete, setLocationToDelete] =
    React.useState<Location | null>(null)

  const fetchLocations = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getLocations({
        page,
        limit: 10,
        sortBy: "created_at",
        sortOrder: "desc",
        searchTerm: appliedSearch || undefined,
      })

      setLocations(result.data)
      setTotal(result.meta?.total ?? 0)
      setTotalPages(result.meta?.totalPages ?? 1)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load locations"
      setError(message)
      setLocations([])
    } finally {
      setIsLoading(false)
    }
  }, [appliedSearch, page])

  React.useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  const openCreateSheet = () => {
    setFormMode("create")
    setSelectedLocation(null)
    setName("")
    setFormError(null)
    setSheetOpen(true)
  }

  const openEditSheet = (location: Location) => {
    setFormMode("edit")
    setSelectedLocation(location)
    setName(location.name)
    setFormError(null)
    setSheetOpen(true)
  }

  const openDeleteSheet = (location: Location) => {
    setLocationToDelete(location)
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
        await createLocation({ name: trimmedName })
      } else if (selectedLocation) {
        await updateLocation(selectedLocation.id, { name: trimmedName })
      }

      setSheetOpen(false)
      await fetchLocations()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.errorMessages?.[0]?.message || err.message
          : err instanceof Error
            ? err.message
            : "Failed to save location"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!locationToDelete) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await deleteLocation(locationToDelete.id)
      setDeleteOpen(false)
      setLocationToDelete(null)

      if (locations.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await fetchLocations()
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to delete location"
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
            Locations
          </h2>
          <p className="text-[#8b95a5]">
            Manage warehouse and storage locations for inventory.
          </p>
        </div>
        <Button onClick={openCreateSheet} className="shrink-0">
          <Plus data-icon="inline-start" />
          Add Location
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
        <div className="border-b border-[#e8eaed] bg-gradient-to-r from-[#373B44] to-[#4a4f5c] px-5 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-[#4DC591]" />
              <div>
                <h3 className="text-base font-semibold text-white">
                  All Locations
                </h3>
                <p className="text-sm text-white/70">
                  {total} location{total === 1 ? "" : "s"} total
                </p>
              </div>
            </div>

            <form onSubmit={handleSearch} className="flex w-full max-w-sm gap-2">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8b95a5]" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name or code..."
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
                  Location Code
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
                      Loading locations...
                    </span>
                  </td>
                </tr>
              ) : locations.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-[#8b95a5]"
                  >
                    No locations found. Create your first location to get
                    started.
                  </td>
                </tr>
              ) : (
                locations.map((location) => (
                  <tr
                    key={location.id}
                    className="transition-colors hover:bg-[#f8f9fb]"
                  >
                    <td className="px-5 py-3.5 font-medium text-[#373B44]">
                      {location.id}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#373B44]">
                      {location.name}
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {location.location_code ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-[#8b95a5]">
                      {formatDate(location.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-[#8b95a5]">
                      {formatDate(location.updated_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditSheet(location)}
                        >
                          <Pencil />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteSheet(location)}
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
              {formMode === "create" ? "Add Location" : "Edit Location"}
            </SheetTitle>
            <SheetDescription>
              {formMode === "create"
                ? "Create a new location. A location code will be auto-generated."
                : "Update the location name."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-4">
            <div className="space-y-2">
              <label
                htmlFor="location-name"
                className="text-sm font-medium text-[#373B44]"
              >
                Name
              </label>
              <Input
                id="location-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Main Warehouse, Shelf A1"
                maxLength={255}
                disabled={isSubmitting}
              />
            </div>

            {formMode === "edit" && selectedLocation?.location_code && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#373B44]">
                  Location Code
                </label>
                <p className="rounded-md border border-[#e8eaed] bg-[#f8f9fb] px-3 py-2 text-sm text-[#5c6370]">
                  {selectedLocation.location_code}
                </p>
              </div>
            )}

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
                {formMode === "create" ? "Create Location" : "Save Changes"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Delete Location</SheetTitle>
            <SheetDescription>
              This action cannot be undone. The location will be permanently
              removed.
            </SheetDescription>
          </SheetHeader>

          <div className="px-4">
            <p className="text-sm text-[#5c6370]">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#373B44]">
                {locationToDelete?.name}
              </span>
              {locationToDelete?.location_code && (
                <>
                  {" "}
                  <span className="text-[#8b95a5]">
                    ({locationToDelete.location_code})
                  </span>
                </>
              )}
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
              Delete Location
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
