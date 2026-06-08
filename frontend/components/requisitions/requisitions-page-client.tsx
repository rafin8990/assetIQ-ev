"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react"

import { RequisitionFormModal } from "@/components/requisitions/requisition-form-modal"
import {
  canApproveRequisition,
  canManageRequisition,
  formatDate,
  formatStatus,
  getStatusBadgeClass,
  selectClassName,
  STATUS_TABS,
} from "@/components/requisitions/requisition-constants"
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
  approveRequisition,
  cancelRequisition,
  deleteRequisition,
  getRequisition,
  getRequisitions,
} from "@/services/requisitions"
import { getUnits } from "@/services/units"
import type { Item } from "@/types/items"
import type { Requisition, RequisitionStatus } from "@/types/requisitions"
import type { Unit } from "@/types/units"

type StatusCounts = {
  pending: number
  approved: number
  cancelled: number
}

export function RequisitionsPageClient() {
  const router = useRouter()
  const authUser = getAuthUser()

  const [requisitions, setRequisitions] = React.useState<Requisition[]>([])
  const [items, setItems] = React.useState<Item[]>([])
  const [units, setUnits] = React.useState<Unit[]>([])
  const [statusCounts, setStatusCounts] = React.useState<StatusCounts>({
    pending: 0,
    approved: 0,
    cancelled: 0,
  })

  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [appliedSearch, setAppliedSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<
    RequisitionStatus | "all"
  >("all")
  const [appliedStatus, setAppliedStatus] = React.useState<
    RequisitionStatus | "all"
  >("all")

  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [formError, setFormError] = React.useState<string | null>(null)

  const [formOpen, setFormOpen] = React.useState(false)
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create")
  const [selectedRequisition, setSelectedRequisition] =
    React.useState<Requisition | null>(null)

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [requisitionToDelete, setRequisitionToDelete] =
    React.useState<Requisition | null>(null)

  const [approveOpen, setApproveOpen] = React.useState(false)
  const [requisitionToApprove, setRequisitionToApprove] =
    React.useState<Requisition | null>(null)

  const [cancelOpen, setCancelOpen] = React.useState(false)
  const [requisitionToCancel, setRequisitionToCancel] =
    React.useState<Requisition | null>(null)

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

  const fetchStatusCounts = React.useCallback(async () => {
    try {
      const [pendingRes, approvedRes, cancelledRes] = await Promise.all([
        getRequisitions({ status: "pending", limit: 1 }),
        getRequisitions({ status: "approved", limit: 1 }),
        getRequisitions({ status: "cancelled", limit: 1 }),
      ])

      setStatusCounts({
        pending: pendingRes.meta?.total ?? 0,
        approved: approvedRes.meta?.total ?? 0,
        cancelled: cancelledRes.meta?.total ?? 0,
      })
    } catch {
      setStatusCounts({ pending: 0, approved: 0, cancelled: 0 })
    }
  }, [])

  const fetchRequisitions = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getRequisitions({
        page,
        limit: 10,
        sortBy: "created_at",
        sortOrder: "desc",
        searchTerm: appliedSearch || undefined,
        status: appliedStatus === "all" ? undefined : appliedStatus,
      })

      setRequisitions(result.data)
      setTotal(result.meta?.total ?? 0)
      setTotalPages(result.meta?.totalPages ?? 1)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load requisitions"
      setError(message)
      setRequisitions([])
    } finally {
      setIsLoading(false)
    }
  }, [appliedSearch, appliedStatus, page])

  const refreshAll = React.useCallback(async () => {
    await Promise.all([fetchRequisitions(), fetchStatusCounts()])
  }, [fetchRequisitions, fetchStatusCounts])

  React.useEffect(() => {
    fetchLookups()
  }, [fetchLookups])

  React.useEffect(() => {
    fetchRequisitions()
  }, [fetchRequisitions])

  React.useEffect(() => {
    fetchStatusCounts()
  }, [fetchStatusCounts])

  const openCreateModal = () => {
    setFormMode("create")
    setSelectedRequisition(null)
    setFormOpen(true)
  }

  const openEditModal = async (requisition: Requisition) => {
    setFormMode("edit")
    setFormError(null)

    try {
      const full = await getRequisition(requisition.id)
      setSelectedRequisition(full)
      setFormOpen(true)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load requisition for editing"
      setError(message)
    }
  }

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    setPage(1)
    setAppliedSearch(searchTerm.trim())
    setAppliedStatus(statusFilter)
  }

  const handleStatusTab = (value: RequisitionStatus | "all") => {
    setStatusFilter(value)
    setAppliedStatus(value)
    setPage(1)
  }

  const handleDelete = async () => {
    if (!requisitionToDelete) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await deleteRequisition(requisitionToDelete.id)
      setDeleteOpen(false)
      setRequisitionToDelete(null)

      if (requisitions.length === 1 && page > 1) {
        setPage(current => current - 1)
      } else {
        await refreshAll()
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to delete requisition"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async () => {
    if (!requisitionToApprove || !authUser) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await approveRequisition(requisitionToApprove.id, authUser.id)
      setApproveOpen(false)
      setRequisitionToApprove(null)
      await refreshAll()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to approve requisition"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async () => {
    if (!requisitionToCancel) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await cancelRequisition(requisitionToCancel.id)
      setCancelOpen(false)
      setRequisitionToCancel(null)
      await refreshAll()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to cancel requisition"
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
            Requisitions
          </h2>
          <p className="text-[#8b95a5]">
            Create, approve, and manage material requisitions.
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus data-icon="inline-start" />
          New Requisition
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#e8eaed] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50">
              <Clock className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-[#8b95a5]">Pending</p>
              <p className="text-2xl font-bold text-[#373B44]">
                {statusCounts.pending}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[#e8eaed] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#e8f8f0]">
              <CheckCircle2 className="size-5 text-[#4DC591]" />
            </div>
            <div>
              <p className="text-sm text-[#8b95a5]">Approved</p>
              <p className="text-2xl font-bold text-[#373B44]">
                {statusCounts.approved}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[#e8eaed] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-red-50">
              <XCircle className="size-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-[#8b95a5]">Cancelled</p>
              <p className="text-2xl font-bold text-[#373B44]">
                {statusCounts.cancelled}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
        <div className="border-b border-[#e8eaed] bg-gradient-to-r from-[#373B44] to-[#4a4f5c] px-5 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="size-5 text-[#4DC591]" />
              <div>
                <h3 className="text-base font-semibold text-white">
                  All Requisitions
                </h3>
                <p className="text-sm text-white/70">
                  {total} requisition{total === 1 ? "" : "s"} total
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
                  placeholder="Search by req ID, description, requester..."
                  className="h-9 border-[#e8eaed] bg-white pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e =>
                  setStatusFilter(e.target.value as RequisitionStatus | "all")
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
            <thead>
              <tr className="border-b border-[#e8eaed] bg-[#f8f9fb]">
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Req ID
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Description
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Requested By
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Items
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Status
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
                    colSpan={7}
                    className="px-5 py-10 text-center text-[#8b95a5]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading requisitions...
                    </span>
                  </td>
                </tr>
              ) : requisitions.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-[#8b95a5]"
                  >
                    No requisitions found. Create your first requisition to get
                    started.
                  </td>
                </tr>
              ) : (
                requisitions.map(requisition => (
                  <tr
                    key={requisition.id}
                    className="transition-colors hover:bg-[#f8f9fb]"
                  >
                    <td className="px-5 py-3.5 font-semibold text-[#373B44]">
                      {requisition.req_id}
                    </td>
                    <td className="max-w-[220px] px-5 py-3.5 text-[#5c6370]">
                      <p className="truncate">
                        {requisition.description || "—"}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {requisition.created_by_name ?? `#${requisition.created_by}`}
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {requisition.items?.length ?? 0}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                          getStatusBadgeClass(requisition.status)
                        )}
                      >
                        {formatStatus(requisition.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#8b95a5]">
                      {formatDate(requisition.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          href={`/requisitions/${requisition.id}`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" })
                          )}
                        >
                          <Eye />
                          View
                        </Link>

                        {canManageRequisition(requisition.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(requisition)}
                          >
                            <Pencil />
                            Edit
                          </Button>
                        )}

                        {canApproveRequisition(
                          authUser?.role,
                          requisition.status
                        ) && (
                          <Button
                            size="sm"
                            className="bg-[#4DC591] hover:bg-[#3db37f]"
                            onClick={() => {
                              setRequisitionToApprove(requisition)
                              setFormError(null)
                              setApproveOpen(true)
                            }}
                          >
                            <CheckCircle2 />
                            Approve
                          </Button>
                        )}

                        {canManageRequisition(requisition.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRequisitionToCancel(requisition)
                              setFormError(null)
                              setCancelOpen(true)
                            }}
                          >
                            <XCircle />
                            Cancel
                          </Button>
                        )}

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setRequisitionToDelete(requisition)
                            setFormError(null)
                            setDeleteOpen(true)
                          }}
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

      <RequisitionFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        requisition={selectedRequisition}
        items={items}
        units={units}
        onSuccess={refreshAll}
        onCreated={created =>
          router.push(`/requisitions/${created.id}?voucher=1`)
        }
      />

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Requisition</DialogTitle>
            <DialogDescription>
              Confirm approval for{" "}
              <span className="font-semibold text-[#373B44]">
                {requisitionToApprove?.req_id}
              </span>
              . This action cannot be undone.
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
              Close
            </Button>
            <Button
              className="bg-[#4DC591] hover:bg-[#3db37f]"
              onClick={handleApprove}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="animate-spin" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Requisition</DialogTitle>
            <DialogDescription>
              Cancel{" "}
              <span className="font-semibold text-[#373B44]">
                {requisitionToCancel?.req_id}
              </span>
              ? The requisition will be marked as cancelled.
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
              onClick={() => setCancelOpen(false)}
              disabled={isSubmitting}
            >
              Keep Pending
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="animate-spin" />}
              Cancel Requisition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Delete Requisition</SheetTitle>
            <SheetDescription>
              This action cannot be undone. The requisition, all line items, and
              any attachment will be permanently removed.
            </SheetDescription>
          </SheetHeader>

          <div className="px-4">
            <p className="text-sm text-[#5c6370]">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#373B44]">
                {requisitionToDelete?.req_id}
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
              Delete Requisition
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
