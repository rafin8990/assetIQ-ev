"use client"

import * as React from "react"
import Link from "next/link"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react"

import { ReturnFormModal } from "@/components/returns/return-form-modal"
import {
  canApproveReturn,
  canDeleteReturnRow,
  canManageReturn,
  formatDate,
  formatStatus,
  getStatusBadgeClass,
  isAdminRole,
  selectClassName,
  STATUS_TABS,
} from "@/components/returns/return-constants"
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
import {
  approveReturnRequest,
  deleteReturnRequest,
  getReturnRequest,
  getReturnRequests,
} from "@/services/returns"
import type { ReturnRequest, ReturnRequestStatus } from "@/types/returns"

export function ReturnsPageClient() {
  const authUser = getAuthUser()
  const isAdmin = isAdminRole(authUser)

  const [returnRequests, setReturnRequests] = React.useState<ReturnRequest[]>(
    []
  )

  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [appliedSearch, setAppliedSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<
    ReturnRequestStatus | "all"
  >("all")
  const [appliedStatus, setAppliedStatus] = React.useState<
    ReturnRequestStatus | "all"
  >("all")

  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [formError, setFormError] = React.useState<string | null>(null)

  const [formOpen, setFormOpen] = React.useState(false)
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create")
  const [selectedReturnRequest, setSelectedReturnRequest] =
    React.useState<ReturnRequest | null>(null)

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [returnToDelete, setReturnToDelete] =
    React.useState<ReturnRequest | null>(null)

  const [approveOpen, setApproveOpen] = React.useState(false)
  const [returnToApprove, setReturnToApprove] =
    React.useState<ReturnRequest | null>(null)

  const fetchReturnRequests = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getReturnRequests({
        page,
        limit: 10,
        sortBy: "created_at",
        sortOrder: "desc",
        searchTerm: appliedSearch || undefined,
        status: appliedStatus === "all" ? undefined : appliedStatus,
        requestedBy: isAdmin ? undefined : authUser?.id,
      })

      setReturnRequests(result.data)
      setTotal(result.meta?.total ?? 0)
      setTotalPages(result.meta?.totalPages ?? 1)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load return requests"
      setError(message)
      setReturnRequests([])
    } finally {
      setIsLoading(false)
    }
  }, [appliedSearch, appliedStatus, authUser?.id, isAdmin, page])

  React.useEffect(() => {
    fetchReturnRequests()
  }, [fetchReturnRequests])

  const openCreateModal = () => {
    setFormMode("create")
    setSelectedReturnRequest(null)
    setFormOpen(true)
  }

  const openEditModal = async (returnRequest: ReturnRequest) => {
    setFormMode("edit")
    setFormError(null)

    try {
      const full = await getReturnRequest(returnRequest.id)
      setSelectedReturnRequest(full)
      setFormOpen(true)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load return request for editing"
      setError(message)
    }
  }

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    setPage(1)
    setAppliedSearch(searchTerm.trim())
    setAppliedStatus(statusFilter)
  }

  const handleStatusTab = (value: ReturnRequestStatus | "all") => {
    setStatusFilter(value)
    setAppliedStatus(value)
    setPage(1)
  }

  const handleDelete = async () => {
    if (!returnToDelete) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await deleteReturnRequest(returnToDelete.id)
      setDeleteOpen(false)
      setReturnToDelete(null)

      if (returnRequests.length === 1 && page > 1) {
        setPage(current => current - 1)
      } else {
        await fetchReturnRequests()
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to delete return request"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async () => {
    if (!returnToApprove) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await approveReturnRequest(returnToApprove.id)
      setApproveOpen(false)
      setReturnToApprove(null)
      await fetchReturnRequests()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to approve return request"
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
            Return
          </h2>
          <p className="text-[#8b95a5]">
            Record and track item returns from outbound requests.
            {isAdmin && " Approve pending returns to restore stock."}
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus data-icon="inline-start" />
          New Return
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
        <div className="border-b border-[#e8eaed] bg-gradient-to-r from-[#373B44] to-[#4a4f5c] px-5 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <RotateCcw className="size-5 text-[#4DC591]" />
              <div>
                <h3 className="text-base font-semibold text-white">
                  {isAdmin ? "All Returns" : "My Returns"}
                </h3>
                <p className="text-sm text-white/70">
                  {total} return{total === 1 ? "" : "s"} total
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
                  placeholder="Search by return ID, out request, or description..."
                  className="h-9 border-[#e8eaed] bg-white pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e =>
                  setStatusFilter(e.target.value as ReturnRequestStatus | "all")
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
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-[#e8eaed] bg-[#f8f9fb]">
              <tr>
                <th className="px-5 py-3 font-medium text-[#8b95a5]">
                  Return ID
                </th>
                <th className="px-5 py-3 font-medium text-[#8b95a5]">
                  Out Request
                </th>
                <th className="px-5 py-3 font-medium text-[#8b95a5]">
                  Description
                </th>
                <th className="px-5 py-3 font-medium text-[#8b95a5]">Items</th>
                <th className="px-5 py-3 font-medium text-[#8b95a5]">
                  Status
                </th>
                {isAdmin && (
                  <th className="px-5 py-3 font-medium text-[#8b95a5]">
                    Requested By
                  </th>
                )}
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
                  <td colSpan={isAdmin ? 8 : 7} className="px-5 py-16 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-[#4DC591]" />
                  </td>
                </tr>
              ) : returnRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 8 : 7}
                    className="px-5 py-16 text-center text-[#8b95a5]"
                  >
                    No return requests found.
                  </td>
                </tr>
              ) : (
                returnRequests.map(returnRequest => {
                  const isOwner = returnRequest.requested_by === authUser?.id
                  const canEdit =
                    isOwner && canManageReturn(returnRequest.status)
                  const canDelete = canDeleteReturnRow(
                    authUser,
                    returnRequest.status,
                    isOwner
                  )
                  const canApprove = canApproveReturn(
                    authUser,
                    returnRequest.status
                  )

                  return (
                    <tr
                      key={returnRequest.id}
                      className="border-b border-[#e8eaed] hover:bg-[#f8f9fb]/60"
                    >
                      <td className="px-5 py-4 font-medium text-[#373B44]">
                        {returnRequest.return_id}
                      </td>
                      <td className="px-5 py-4 text-[#5c6370]">
                        {returnRequest.out_request_request_id ?? "—"}
                      </td>
                      <td className="max-w-[200px] truncate px-5 py-4 text-[#5c6370]">
                        {returnRequest.description || "—"}
                      </td>
                      <td className="px-5 py-4 text-[#5c6370]">
                        {returnRequest.items.length}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                            getStatusBadgeClass(returnRequest.status)
                          )}
                        >
                          {formatStatus(returnRequest.status)}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-4 text-[#5c6370]">
                          {returnRequest.requested_by_name ?? "—"}
                        </td>
                      )}
                      <td className="px-5 py-4 text-[#5c6370]">
                        {formatDate(returnRequest.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/outbound/return/${returnRequest.id}`}
                            className={buttonVariants({
                              variant: "ghost",
                              size: "icon-sm",
                            })}
                            title="View details"
                          >
                            <Eye className="size-4" />
                          </Link>
                          {canApprove && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setReturnToApprove(returnRequest)
                                setApproveOpen(true)
                              }}
                              title="Approve return"
                            >
                              <CheckCircle2 className="size-4 text-[#2d9f6f]" />
                            </Button>
                          )}
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEditModal(returnRequest)}
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
                                setReturnToDelete(returnRequest)
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

      <ReturnFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        returnRequest={selectedReturnRequest}
        onSuccess={fetchReturnRequests}
      />

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Return</DialogTitle>
            <DialogDescription>
              Approve {returnToApprove?.return_id}? Item quantities will be added
              back to stock.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <DialogBody>
              <p className="text-sm text-red-600">{formError}</p>
            </DialogBody>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Approve Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Delete Return</SheetTitle>
            <SheetDescription>
              Delete {returnToDelete?.return_id}? This cannot be undone.
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
