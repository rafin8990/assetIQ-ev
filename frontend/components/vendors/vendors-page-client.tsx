"use client"

import * as React from "react"
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Store,
  Trash2,
  X,
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
import { ApiError, getAssetUrl } from "@/lib/api/client"
import {
  createVendor,
  deleteVendor,
  updateVendor,
  getVendors,
} from "@/services/vendors"
import type { Vendor } from "@/types/vendors"

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

export function VendorsPageClient() {
  const [vendors, setVendors] = React.useState<Vendor[]>([])
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
  const [selectedVendor, setSelectedVendor] = React.useState<Vendor | null>(null)
  const [vendorName, setVendorName] = React.useState("")
  const [companyName, setCompanyName] = React.useState("")
  const [mobileNumber, setMobileNumber] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [imageFile, setImageFile] = React.useState<File | null>(null)
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [vendorToDelete, setVendorToDelete] = React.useState<Vendor | null>(
    null
  )

  const existingImageUrl =
    formMode === "edit" && selectedVendor?.image && !imageFile
      ? getAssetUrl(selectedVendor.image)
      : null

  const fetchVendors = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getVendors({
        page,
        limit: 10,
        sortBy: "created_at",
        sortOrder: "desc",
        searchTerm: appliedSearch || undefined,
      })

      setVendors(result.data)
      setTotal(result.meta?.total ?? 0)
      setTotalPages(result.meta?.totalPages ?? 1)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load vendors"
      setError(message)
      setVendors([])
    } finally {
      setIsLoading(false)
    }
  }, [appliedSearch, page])

  React.useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  React.useEffect(() => {
    if (!imageFile) {
      setImagePreview(null)
      return
    }

    const url = URL.createObjectURL(imageFile)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const resetForm = () => {
    setVendorName("")
    setCompanyName("")
    setMobileNumber("")
    setEmail("")
    setImageFile(null)
    setImagePreview(null)
    setFormError(null)
  }

  const openCreateSheet = () => {
    setFormMode("create")
    setSelectedVendor(null)
    resetForm()
    setSheetOpen(true)
  }

  const openEditSheet = (vendor: Vendor) => {
    setFormMode("edit")
    setSelectedVendor(vendor)
    setVendorName(vendor.vendor_name)
    setCompanyName(vendor.company_name ?? "")
    setMobileNumber(vendor.mobile_number ?? "")
    setEmail(vendor.email ?? "")
    setImageFile(null)
    setImagePreview(null)
    setFormError(null)
    setSheetOpen(true)
  }

  const openDeleteSheet = (vendor: Vendor) => {
    setVendorToDelete(vendor)
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
    const trimmedName = vendorName.trim()

    if (!trimmedName) {
      setFormError("Vendor name is required")
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    const payload = {
      vendor_name: trimmedName,
      company_name: normalizeOptional(companyName),
      mobile_number: normalizeOptional(mobileNumber),
      email: normalizeOptional(email),
    }

    try {
      if (formMode === "create") {
        await createVendor(payload, imageFile)
      } else if (selectedVendor) {
        await updateVendor(selectedVendor.id, payload, imageFile)
      }

      setSheetOpen(false)
      await fetchVendors()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.errorMessages?.[0]?.message || err.message
          : err instanceof Error
            ? err.message
            : "Failed to save vendor"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!vendorToDelete) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await deleteVendor(vendorToDelete.id)
      setDeleteOpen(false)
      setVendorToDelete(null)

      if (vendors.length === 1 && page > 1) {
        setPage(current => current - 1)
      } else {
        await fetchVendors()
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to delete vendor"
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
            Vendors
          </h2>
          <p className="text-[#8b95a5]">
            Manage vendor profiles, contacts, and supplier relationships.
          </p>
        </div>
        <Button onClick={openCreateSheet} className="shrink-0">
          <Plus data-icon="inline-start" />
          Add Vendor
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
        <div className="border-b border-[#e8eaed] bg-gradient-to-r from-[#373B44] to-[#4a4f5c] px-5 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Store className="size-5 text-[#4DC591]" />
              <div>
                <h3 className="text-base font-semibold text-white">
                  All Vendors
                </h3>
                <p className="text-sm text-white/70">
                  {total} vendor{total === 1 ? "" : "s"} total
                </p>
              </div>
            </div>

            <form onSubmit={handleSearch} className="flex w-full max-w-md gap-2">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8b95a5]" />
                <Input
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Search by name, company, email, phone..."
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
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e8eaed] bg-[#f8f9fb]">
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Vendor
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Company
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Contact
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Created
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
                      Loading vendors...
                    </span>
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-[#8b95a5]"
                  >
                    No vendors found. Add your first vendor to get started.
                  </td>
                </tr>
              ) : (
                vendors.map(vendor => {
                  const imageUrl = getAssetUrl(vendor.image)

                  return (
                    <tr
                      key={vendor.id}
                      className="transition-colors hover:bg-[#f8f9fb]"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="size-11 overflow-hidden rounded-lg border border-[#e8eaed] bg-[#f8f9fb]">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={vendor.vendor_name}
                                className="size-full object-cover"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center text-[#8b95a5]">
                                <Store className="size-4" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-[#373B44]">
                              {vendor.vendor_name}
                            </p>
                            <p className="text-xs text-[#8b95a5]">
                              ID #{vendor.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[#5c6370]">
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-[#8b95a5]" />
                          {vendor.company_name ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="space-y-1 text-[#5c6370]">
                          {vendor.mobile_number ? (
                            <p className="inline-flex items-center gap-1.5">
                              <Phone className="size-3.5 text-[#8b95a5]" />
                              {vendor.mobile_number}
                            </p>
                          ) : null}
                          {vendor.email ? (
                            <p className="inline-flex items-center gap-1.5">
                              <Mail className="size-3.5 text-[#8b95a5]" />
                              {vendor.email}
                            </p>
                          ) : null}
                          {!vendor.mobile_number && !vendor.email && "—"}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[#8b95a5]">
                        {formatDate(vendor.created_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditSheet(vendor)}
                          >
                            <Pencil />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteSheet(vendor)}
                          >
                            <Trash2 />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {formMode === "create" ? "Add Vendor" : "Edit Vendor"}
            </SheetTitle>
            <SheetDescription>
              {formMode === "create"
                ? "Register a new supplier with contact details and logo."
                : "Update vendor profile and contact information."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-4">
            <div className="space-y-2">
              <label
                htmlFor="vendor-name"
                className="text-sm font-medium text-[#373B44]"
              >
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="vendor-name"
                value={vendorName}
                onChange={event => setVendorName(event.target.value)}
                placeholder="e.g. ABC Supplies"
                maxLength={255}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="company-name"
                className="text-sm font-medium text-[#373B44]"
              >
                Company Name
              </label>
              <Input
                id="company-name"
                value={companyName}
                onChange={event => setCompanyName(event.target.value)}
                placeholder="e.g. ABC Ltd (optional)"
                maxLength={255}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="mobile-number"
                className="text-sm font-medium text-[#373B44]"
              >
                Mobile Number
              </label>
              <Input
                id="mobile-number"
                value={mobileNumber}
                onChange={event => setMobileNumber(event.target.value)}
                placeholder="e.g. +8801712345678 (optional)"
                maxLength={50}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="vendor-email"
                className="text-sm font-medium text-[#373B44]"
              >
                Email
              </label>
              <Input
                id="vendor-email"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="contact@vendor.com (optional)"
                maxLength={255}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-3 rounded-lg border border-dashed border-[#d5dae1] bg-[#f8f9fb] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#373B44]">Logo</p>
                  <p className="text-xs text-[#8b95a5]">
                    JPG, PNG, WEBP or GIF (max 5MB)
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#373B44] px-3 py-2 text-sm font-medium text-white hover:bg-[#4a4f5c]">
                  <ImagePlus className="size-4" />
                  {imageFile ? "Change" : "Upload"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={event =>
                      setImageFile(event.target.files?.[0] ?? null)
                    }
                    disabled={isSubmitting}
                  />
                </label>
              </div>

              {(imagePreview || existingImageUrl) && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview ?? existingImageUrl ?? ""}
                    alt="Vendor logo preview"
                    className="size-20 rounded-lg border border-[#e8eaed] object-cover"
                  />
                  {imageFile && (
                    <button
                      type="button"
                      onClick={() => setImageFile(null)}
                      className="absolute -top-2 -right-2 rounded-full bg-[#373B44] p-1 text-white"
                      disabled={isSubmitting}
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

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
                {formMode === "create" ? "Create Vendor" : "Save Changes"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Delete Vendor</SheetTitle>
            <SheetDescription>
              This action cannot be undone. The vendor profile and logo will be
              permanently removed.
            </SheetDescription>
          </SheetHeader>

          <div className="px-4">
            <p className="text-sm text-[#5c6370]">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#373B44]">
                {vendorToDelete?.vendor_name}
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
              Delete Vendor
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
