"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  Pencil,
  Trash2,
  XCircle,
} from "lucide-react"

import { RequisitionFormModal } from "@/components/requisitions/requisition-form-modal"
import { RequisitionVoucherCard } from "@/components/requisitions/requisition-voucher-card"
import {
  canApproveRequisition,
  canManageRequisition,
  formatDate,
  formatStatus,
  getStatusBadgeClass,
} from "@/components/requisitions/requisition-constants"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { getAssetUrl, ApiError } from "@/lib/api/client"
import { getAuthUser } from "@/lib/auth/token"
import { getItems } from "@/services/items"
import {
  approveRequisition,
  cancelRequisition,
  deleteRequisition,
  getRequisition,
} from "@/services/requisitions"
import { getUnits } from "@/services/units"
import type { Item } from "@/types/items"
import type { Requisition } from "@/types/requisitions"
import type { Unit } from "@/types/units"

type RequisitionDetailClientProps = {
  requisitionId: number
}

function DetailField({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-[#e8eaed] bg-white p-4">
      <p className="text-xs font-medium tracking-wide text-[#8b95a5] uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[#373B44]">{value}</p>
    </div>
  )
}

export function RequisitionDetailClient({
  requisitionId,
}: RequisitionDetailClientProps) {
  const searchParams = useSearchParams()
  const showVoucherHighlight = searchParams.get("voucher") === "1"
  const authUser = getAuthUser()

  const [requisition, setRequisition] = React.useState<Requisition | null>(null)
  const [items, setItems] = React.useState<Item[]>([])
  const [units, setUnits] = React.useState<Unit[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [formError, setFormError] = React.useState<string | null>(null)

  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [approveOpen, setApproveOpen] = React.useState(false)
  const [cancelOpen, setCancelOpen] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [requisitionData, itemsRes, unitsRes] = await Promise.all([
        getRequisition(requisitionId),
        getItems({ limit: 200, sortBy: "name", sortOrder: "asc" }),
        getUnits({ limit: 100, sortBy: "name", sortOrder: "asc" }),
      ])

      setRequisition(requisitionData)
      setItems(itemsRes.data)
      setUnits(unitsRes.data)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load requisition"
      setError(message)
      setRequisition(null)
    } finally {
      setIsLoading(false)
    }
  }, [requisitionId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleApprove = async () => {
    if (!requisition || !authUser) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await approveRequisition(requisition.id, authUser.id)
      setApproveOpen(false)
      await fetchData()
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
    if (!requisition) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await cancelRequisition(requisition.id)
      setCancelOpen(false)
      await fetchData()
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

  const handleDelete = async () => {
    if (!requisition) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await deleteRequisition(requisition.id)
      window.location.href = "/requisitions"
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to delete requisition"
      setFormError(message)
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-[#8b95a5]">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-5 animate-spin" />
          Loading requisition details...
        </span>
      </div>
    )
  }

  if (error || !requisition) {
    return (
      <div className="space-y-4">
        <Link
          href="/requisitions"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ArrowLeft />
          Back to Requisitions
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error ?? "Requisition not found"}
        </div>
      </div>
    )
  }

  const attachmentUrl = getAssetUrl(requisition.attachment)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Link
            href="/requisitions"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ArrowLeft />
            Back to Requisitions
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#f8f9fb]">
              <ClipboardList className="size-6 text-[#4DC591]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#373B44]">
                {requisition.req_id}
              </h2>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                    getStatusBadgeClass(requisition.status)
                  )}
                >
                  {formatStatus(requisition.status)}
                </span>
                <span className="text-sm text-[#8b95a5]">
                  Created {formatDate(requisition.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canManageRequisition(requisition.status) && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil />
              Edit
            </Button>
          )}

          {canApproveRequisition(authUser?.role, requisition.status) && (
            <Button
              className="bg-[#4DC591] hover:bg-[#3db37f]"
              onClick={() => {
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
              onClick={() => {
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
            onClick={() => {
              setFormError(null)
              setDeleteOpen(true)
            }}
          >
            <Trash2 />
            Delete
          </Button>
        </div>
      </div>

      <RequisitionVoucherCard
        requisition={requisition}
        highlight={showVoucherHighlight}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DetailField
          label="Requested By"
          value={requisition.created_by_name ?? `#${requisition.created_by}`}
        />
        <DetailField
          label="Approved By"
          value={
            requisition.approved_by_name ??
            (requisition.approved_by ? `#${requisition.approved_by}` : "—")
          }
        />
        <DetailField
          label="Last Updated"
          value={formatDate(requisition.updated_at)}
        />
        <DetailField
          label="Line Items"
          value={`${requisition.items.length} item${requisition.items.length === 1 ? "" : "s"}`}
        />
      </div>

      <Card className="border-[#e8eaed] p-5">
        <h3 className="text-base font-semibold text-[#373B44]">Description</h3>
        <p className="mt-2 text-sm text-[#5c6370]">
          {requisition.description || "No description provided."}
        </p>
      </Card>

      <Card className="overflow-hidden border-[#e8eaed] p-0">
        <div className="border-b border-[#e8eaed] bg-[#f8f9fb] px-5 py-4">
          <h3 className="text-base font-semibold text-[#373B44]">
            Requested Items
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e8eaed]">
                <th className="px-5 py-3 font-semibold text-[#373B44]">#</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Item</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Quantity
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8eaed]">
              {requisition.items.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-5 py-3.5 text-[#8b95a5]">{index + 1}</td>
                  <td className="px-5 py-3.5 font-medium text-[#373B44]">
                    {item.item_name ?? `Item #${item.item_id}`}
                  </td>
                  <td className="px-5 py-3.5 text-[#5c6370]">
                    {item.quantity}
                  </td>
                  <td className="px-5 py-3.5 text-[#5c6370]">
                    {item.unit_name ?? `Unit #${item.unit_id}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {attachmentUrl && (
        <Card className="border-[#e8eaed] p-5">
          <h3 className="text-base font-semibold text-[#373B44]">Attachment</h3>
          <a
            href={attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#4DC591] hover:underline"
          >
            <FileText className="size-4" />
            Open attachment
          </a>
        </Card>
      )}

      <RequisitionFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        requisition={requisition}
        items={items}
        units={units}
        onSuccess={fetchData}
      />

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Requisition</DialogTitle>
            <DialogDescription>
              Confirm approval for {requisition.req_id}.
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
              Cancel {requisition.req_id}? It will be marked as cancelled.
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
              Permanently delete {requisition.req_id} and its attachment.
            </SheetDescription>
          </SheetHeader>
          {formError && (
            <div className="px-4">
              <p className="text-sm text-red-600">{formError}</p>
            </div>
          )}
          <SheetFooter className="px-4">
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
