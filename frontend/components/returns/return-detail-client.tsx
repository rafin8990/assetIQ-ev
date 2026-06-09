"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Pencil,
  Trash2,
  XCircle,
} from "lucide-react"

import { ReturnFormModal } from "@/components/returns/return-form-modal"
import {
  canApproveReturn,
  canDeleteReturnRow,
  canManageReturn,
  formatDate,
  formatStatus,
  getStatusBadgeClass,
} from "@/components/returns/return-constants"
import { Button } from "@/components/ui/button"
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
import { ApiError } from "@/lib/api/client"
import { getAuthUser } from "@/lib/auth/token"
import {
  approveReturnRequest,
  cancelReturnRequest,
  deleteReturnRequest,
  getReturnRequest,
} from "@/services/returns"
import type { ReturnRequest } from "@/types/returns"

type ReturnDetailClientProps = {
  returnRequestId: number
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

export function ReturnDetailClient({
  returnRequestId,
}: ReturnDetailClientProps) {
  const authUser = getAuthUser()

  const [returnRequest, setReturnRequest] =
    React.useState<ReturnRequest | null>(null)
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
      const data = await getReturnRequest(returnRequestId)
      setReturnRequest(data)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load return request"
      setError(message)
      setReturnRequest(null)
    } finally {
      setIsLoading(false)
    }
  }, [returnRequestId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const isOwner = returnRequest?.requested_by === authUser?.id
  const canEdit =
    isOwner && returnRequest && canManageReturn(returnRequest.status)
  const canDelete =
    returnRequest &&
    canDeleteReturnRow(authUser, returnRequest.status, isOwner)
  const canApprove =
    returnRequest &&
    canApproveReturn(authUser, returnRequest.status)
  const canCancel =
    returnRequest && canManageReturn(returnRequest.status)

  const handleApprove = async () => {
    if (!returnRequest) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await approveReturnRequest(returnRequest.id)
      setApproveOpen(false)
      await fetchData()
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

  const handleCancel = async () => {
    if (!returnRequest) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await cancelReturnRequest(returnRequest.id)
      setCancelOpen(false)
      await fetchData()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to cancel return request"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!returnRequest) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await deleteReturnRequest(returnRequest.id)
      window.location.href = "/outbound/return"
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

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#4DC591]" />
      </div>
    )
  }

  if (error || !returnRequest) {
    return (
      <div className="space-y-4">
        <Link
          href="/outbound/return"
          className="inline-flex items-center gap-2 text-sm text-[#5c6370] hover:text-[#373B44]"
        >
          <ArrowLeft className="size-4" />
          Back to Returns
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          {error ?? "Return request not found"}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/outbound/return"
            className="inline-flex items-center gap-2 text-sm text-[#5c6370] hover:text-[#373B44]"
          >
            <ArrowLeft className="size-4" />
            Back to Returns
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-[#373B44]">
              {returnRequest.return_id}
            </h2>
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                getStatusBadgeClass(returnRequest.status)
              )}
            >
              {formatStatus(returnRequest.status)}
            </span>
          </div>
          <p className="text-[#8b95a5]">
            Return from out request{" "}
            <Link
              href={`/outbound/out-request/${returnRequest.out_request_id}`}
              className="font-medium text-[#2d9f6f] hover:underline"
            >
              {returnRequest.out_request_request_id}
            </Link>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canApprove && (
            <Button onClick={() => setApproveOpen(true)}>
              <CheckCircle2 data-icon="inline-start" />
              Approve Return
            </Button>
          )}
          {canCancel && (
            <Button variant="outline" onClick={() => setCancelOpen(true)}>
              <XCircle data-icon="inline-start" />
              Cancel
            </Button>
          )}
          {canEdit && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil data-icon="inline-start" />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 data-icon="inline-start" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DetailField
          label="Out Request"
          value={returnRequest.out_request_request_id ?? "—"}
        />
        <DetailField
          label="Requested By"
          value={returnRequest.requested_by_name ?? "—"}
        />
        <DetailField
          label="Approved By"
          value={returnRequest.approved_by_name ?? "—"}
        />
        <DetailField
          label="Created"
          value={formatDate(returnRequest.created_at)}
        />
      </div>

      {returnRequest.description && (
        <Card className="border-[#e8eaed] p-4">
          <p className="text-xs font-medium tracking-wide text-[#8b95a5] uppercase">
            Description
          </p>
          <p className="mt-2 text-sm text-[#373B44]">
            {returnRequest.description}
          </p>
        </Card>
      )}

      <Card className="overflow-hidden border-[#e8eaed]">
        <div className="border-b border-[#e8eaed] bg-[#f8f9fb] px-5 py-3">
          <h3 className="font-semibold text-[#373B44]">Return Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-[#e8eaed]">
              <tr>
                <th className="px-5 py-3 font-medium text-[#8b95a5]">Item</th>
                <th className="px-5 py-3 font-medium text-[#8b95a5]">
                  Out Qty
                </th>
                <th className="px-5 py-3 font-medium text-[#8b95a5]">
                  Return Qty
                </th>
                <th className="px-5 py-3 font-medium text-[#8b95a5]">Unit</th>
              </tr>
            </thead>
            <tbody>
              {returnRequest.items.map(item => (
                <tr
                  key={item.id}
                  className="border-b border-[#e8eaed] last:border-0"
                >
                  <td className="px-5 py-4 font-medium text-[#373B44]">
                    {item.item_name ?? `Item #${item.item_id}`}
                  </td>
                  <td className="px-5 py-4 text-[#5c6370]">
                    {item.out_quantity ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-[#5c6370]">
                    {item.return_quantity}
                  </td>
                  <td className="px-5 py-4 text-[#5c6370]">
                    {item.unit_name ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ReturnFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        returnRequest={returnRequest}
        onSuccess={fetchData}
      />

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Return</DialogTitle>
            <DialogDescription>
              Approve this return? Item quantities will be added back to stock.
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

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Return</DialogTitle>
            <DialogDescription>
              Cancel this pending return request?
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
              Keep Return
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="animate-spin" />}
              Cancel Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Delete Return</SheetTitle>
            <SheetDescription>
              Delete {returnRequest.return_id}? This cannot be undone.
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
