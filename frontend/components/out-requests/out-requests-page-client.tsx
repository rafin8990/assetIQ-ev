"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
} from "lucide-react"

import { OutRequestFormModal } from "@/components/out-requests/out-request-form-modal"
import {
  canDeleteOutRequestRow,
  canManageOutRequest,
  formatDate,
  formatStatus,
  getStatusBadgeClass,
  selectClassName,
  STATUS_TABS,
} from "@/components/out-requests/out-request-constants"
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
import { getAuthUser } from "@/lib/auth/token"
import { getItems } from "@/services/items"
import {
  deleteOutRequest,
  getOutRequest,
  getOutRequests,
} from "@/services/out-requests"
import { getUnits } from "@/services/units"
import type { Item } from "@/types/items"
import type { OutRequest, OutRequestStatus } from "@/types/out-requests"
import type { Unit } from "@/types/units"

export function OutRequestsPageClient() {
  const router = useRouter()
  const authUser = getAuthUser()
  const requestedById = authUser?.id

  const [outRequests, setOutRequests] = React.useState<OutRequest[]>([])
  const [items, setItems] = React.useState<Item[]>([])
  const [units, setUnits] = React.useState<Unit[]>([])

  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [appliedSearch, setAppliedSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<
    OutRequestStatus | "all"
  >("all")
  const [appliedStatus, setAppliedStatus] = React.useState<
    OutRequestStatus | "all"
  >("all")

  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [formError, setFormError] = React.useState<string | null>(null)

  const [formOpen, setFormOpen] = React.useState(false)
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create")
  const [selectedOutRequest, setSelectedOutRequest] =
    React.useState<OutRequest | null>(null)

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [outRequestToDelete, setOutRequestToDelete] =
    React.useState<OutRequest | null>(null)

  const fetchLookups = React.useCallback(async () => {
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
  }, [])

  const fetchOutRequests = React.useCallback(async () => {
    if (!requestedById) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await getOutRequests({
        page,
        limit: 10,
        sortBy: "created_at",
        sortOrder: "desc",
        searchTerm: appliedSearch || undefined,
        status: appliedStatus === "all" ? undefined : appliedStatus,
        requestedBy: requestedById,
      })

      setOutRequests(result.data)
      setTotal(result.meta?.total ?? 0)
      setTotalPages(result.meta?.totalPages ?? 1)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load out requests"
      setError(message)
      setOutRequests([])
    } finally {
      setIsLoading(false)
    }
  }, [appliedSearch, appliedStatus, page, requestedById])

  React.useEffect(() => {
    fetchLookups()
  }, [fetchLookups])

  React.useEffect(() => {
    fetchOutRequests()
  }, [fetchOutRequests])

  const openCreateModal = () => {
    setFormMode("create")
    setSelectedOutRequest(null)
    setFormOpen(true)
  }

  const openEditModal = async (outRequest: OutRequest) => {
    setFormMode("edit")
    setFormError(null)

    try {
      const full = await getOutRequest(outRequest.id)
      setSelectedOutRequest(full)
      setFormOpen(true)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load out request for editing"
      setError(message)
    }
  }

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    setPage(1)
    setAppliedSearch(searchTerm.trim())
    setAppliedStatus(statusFilter)
  }

  const handleStatusTab = (value: OutRequestStatus | "all") => {
    setStatusFilter(value)
    setAppliedStatus(value)
    setPage(1)
  }

  const handleDelete = async () => {
    if (!outRequestToDelete) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await deleteOutRequest(outRequestToDelete.id)
      setDeleteOpen(false)
      setOutRequestToDelete(null)

      if (outRequests.length === 1 && page > 1) {
        setPage(current => current - 1)
      } else {
        await fetchOutRequests()
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to delete out request"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreated = (created: OutRequest) => {
    router.push(`/outbound/out-request/${created.id}?voucher=1`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#373B44]">
            Out Request
          </h2>
          <p className="text-[#8b95a5]">
            Create and track your outbound material requests.
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus data-icon="inline-start" />
          New Out Request
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
        <div className="border-b border-[#e8eaed] bg-gradient-to-r from-[#373B44] to-[#4a4f5c] px-5 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Send className="size-5 text-[#4DC591]" />
              <div>
                <h3 className="text-base font-semibold text-white">
                  My Out Requests
                </h3>
                <p className="text-sm text-white/70">
                  {total} request{total === 1 ? "" : "s"} total
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map(tab => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleStatusTab(tab.value)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    appliedStatus === tab.value
                      ? "bg-[#4DC591] text-white"
                      : "bg-white/10 text-white/80 hover:bg-white/20"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleSearch}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8b95a5]" />
                <Input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search by request ID or description..."
                  className="h-9 border-[#e8eaed] bg-white pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e =>
                  setStatusFilter(e.target.value as OutRequestStatus | "all")
                }
                className={cn(selectClassName, "sm:w-44")}
              >
                {STATUS_TABS.map(tab => (
                  <option key={tab.value} value={tab.value}>
                    {tab.label}
                  </option>
                ))}
              </select>
              <Button
                type="submit"
                variant="outline"
                className="bg-white sm:w-auto"
              >
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
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-[#e8eaed] bg-[#f8f9fb]">
              <tr>
                <th className="px-5 py-3 font-medium text-[#8b95a5]">
                  Request ID
                </th>
                <th className="px-5 py-3 font-medium text-[#8b95a5]">
                  Description
                </th>
                <th className="px-5 py-3 font-medium text-[#8b95a5]">
                  Items
                </th>
                <th className="px-5 py-3 font-medium text-[#8b95a5]">
                  Status
                </th>
                <th className="px-5 py-3 font-medium text-[#8b95a5]">
                  Created
                </th>
                <th className="px-5 py-3 text-right font-medium text-[#8b95a5]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-[#4DC591]" />
                  </td>
                </tr>
              ) : outRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-16 text-center text-[#8b95a5]"
                  >
                    No out requests found. Create your first request to get
                    started.
                  </td>
                </tr>
              ) : (
                outRequests.map(outRequest => {
                  const isOwner = outRequest.requested_by === requestedById
                  const canEdit = isOwner && canManageOutRequest(outRequest.status)
                  const canDelete = canDeleteOutRequestRow(
                    authUser,
                    outRequest.status,
                    isOwner
                  )

                  return (
                  <tr
                    key={outRequest.id}
                    className="border-b border-[#e8eaed] hover:bg-[#f8f9fb]/60"
                  >
                    <td className="px-5 py-4 font-medium text-[#373B44]">
                      {outRequest.request_id}
                    </td>
                    <td className="max-w-[240px] truncate px-5 py-4 text-[#5c6370]">
                      {outRequest.description || "—"}
                    </td>
                    <td className="px-5 py-4 text-[#5c6370]">
                      {outRequest.items.length}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                          getStatusBadgeClass(outRequest.status)
                        )}
                      >
                        {formatStatus(outRequest.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#5c6370]">
                      {formatDate(outRequest.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/outbound/out-request/${outRequest.id}`}
                          className={buttonVariants({
                            variant: "ghost",
                            size: "icon-sm",
                          })}
                          title="View details"
                        >
                          <Eye className="size-4" />
                        </Link>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEditModal(outRequest)}
                            title="Edit"
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setOutRequestToDelete(outRequest)
                              setDeleteOpen(true)
                            }}
                            title="Delete"
                          >
                            <Trash2 className="size-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#e8eaed] px-5 py-4">
            <p className="text-sm text-[#8b95a5]">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(current => Math.max(1, current - 1))}
                disabled={page <= 1 || isLoading}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage(current => Math.min(totalPages, current + 1))
                }
                disabled={page >= totalPages || isLoading}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <OutRequestFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        outRequest={selectedOutRequest}
        items={items}
        units={units}
        onSuccess={fetchOutRequests}
        onCreated={handleCreated}
      />

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Delete Out Request</SheetTitle>
            <SheetDescription>
              Delete {outRequestToDelete?.request_id}? This cannot be undone.
            </SheetDescription>
          </SheetHeader>
          {formError && (
            <p className="px-4 text-sm text-red-600">{formError}</p>
          )}
          <SheetFooter>
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
              Delete
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
