"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  PackageCheck,
  Pencil,
  ShoppingCart,
  Trash2,
  XCircle,
} from "lucide-react"

import { PurchaseOrderFormModal } from "@/components/purchase-orders/purchase-order-form-modal"
import { PurchaseOrderVoucherCard } from "@/components/purchase-orders/purchase-order-voucher-card"
import {
  canApprovePurchaseOrder,
  canCancelPurchaseOrder,
  canManagePurchaseOrder,
  canReceivePurchaseOrder,
  formatCurrency,
  formatDate,
  formatOrderType,
  formatStatus,
  getStatusBadgeClass,
} from "@/components/purchase-orders/purchase-order-constants"
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
  approvePurchaseOrder,
  cancelPurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrder,
  receivePurchaseOrder,
} from "@/services/purchase-orders"
import { getUnits } from "@/services/units"
import type { Item } from "@/types/items"
import type { PurchaseOrder } from "@/types/purchase-orders"
import type { Unit } from "@/types/units"

type PurchaseOrderDetailClientProps = {
  purchaseOrderId: number
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

export function PurchaseOrderDetailClient({
  purchaseOrderId,
}: PurchaseOrderDetailClientProps) {
  const searchParams = useSearchParams()
  const showVoucherHighlight = searchParams.get("voucher") === "1"
  const authUser = getAuthUser()

  const [purchaseOrder, setPurchaseOrder] =
    React.useState<PurchaseOrder | null>(null)
  const [items, setItems] = React.useState<Item[]>([])
  const [units, setUnits] = React.useState<Unit[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [formError, setFormError] = React.useState<string | null>(null)

  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [approveOpen, setApproveOpen] = React.useState(false)
  const [receiveOpen, setReceiveOpen] = React.useState(false)
  const [cancelOpen, setCancelOpen] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [poData, itemsRes, unitsRes] = await Promise.all([
        getPurchaseOrder(purchaseOrderId),
        getItems({ limit: 200, sortBy: "name", sortOrder: "asc" }),
        getUnits({ limit: 100, sortBy: "name", sortOrder: "asc" }),
      ])

      setPurchaseOrder(poData)
      setItems(itemsRes.data)
      setUnits(unitsRes.data)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load purchase order"
      setError(message)
      setPurchaseOrder(null)
    } finally {
      setIsLoading(false)
    }
  }, [purchaseOrderId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleApprove = async () => {
    if (!purchaseOrder || !authUser) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await approvePurchaseOrder(purchaseOrder.id, authUser.id)
      setApproveOpen(false)
      await fetchData()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to approve purchase order"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReceive = async () => {
    if (!purchaseOrder || !authUser) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await receivePurchaseOrder(purchaseOrder.id, authUser.id)
      setReceiveOpen(false)
      await fetchData()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to mark purchase order as received"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async () => {
    if (!purchaseOrder) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await cancelPurchaseOrder(purchaseOrder.id)
      setCancelOpen(false)
      await fetchData()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to cancel purchase order"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!purchaseOrder) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await deletePurchaseOrder(purchaseOrder.id)
      window.location.href = "/purchase-orders"
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to delete purchase order"
      setFormError(message)
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-[#8b95a5]">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-5 animate-spin" />
          Loading purchase order details...
        </span>
      </div>
    )
  }

  if (error || !purchaseOrder) {
    return (
      <div className="space-y-4">
        <Link
          href="/purchase-orders"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ArrowLeft />
          Back to Purchase Orders
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error ?? "Purchase order not found"}
        </div>
      </div>
    )
  }

  const attachmentUrl = getAssetUrl(purchaseOrder.attachment)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Link
            href="/purchase-orders"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ArrowLeft />
            Back to Purchase Orders
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#f8f9fb]">
              <ShoppingCart className="size-6 text-[#4DC591]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#373B44]">
                {purchaseOrder.po_number}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                    getStatusBadgeClass(purchaseOrder.status)
                  )}
                >
                  {formatStatus(purchaseOrder.status)}
                </span>
                <span className="text-sm text-[#8b95a5]">
                  {formatOrderType(purchaseOrder.order_type)}
                </span>
                <span className="text-sm text-[#8b95a5]">
                  Created {formatDate(purchaseOrder.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canManagePurchaseOrder(purchaseOrder.status) && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil />
              Edit
            </Button>
          )}

          {canApprovePurchaseOrder(authUser?.role, purchaseOrder.status) && (
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

          {canReceivePurchaseOrder(authUser?.role, purchaseOrder.status) && (
            <Button
              variant="outline"
              onClick={() => {
                setFormError(null)
                setReceiveOpen(true)
              }}
            >
              <PackageCheck />
              Receive
            </Button>
          )}

          {canCancelPurchaseOrder(purchaseOrder.status) && (
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

      <PurchaseOrderVoucherCard
        purchaseOrder={purchaseOrder}
        highlight={showVoucherHighlight}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DetailField
          label="Total Amount"
          value={formatCurrency(purchaseOrder.total_amount)}
        />
        <DetailField
          label="Paid Amount"
          value={formatCurrency(purchaseOrder.paid_amount)}
        />
        <DetailField
          label="Due Amount"
          value={formatCurrency(purchaseOrder.due_amount)}
        />
        <DetailField
          label="Discount"
          value={formatCurrency(purchaseOrder.discount_amount)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DetailField
          label="Created By"
          value={
            purchaseOrder.created_by_name ?? `#${purchaseOrder.created_by}`
          }
        />
        <DetailField
          label="Approved By"
          value={
            purchaseOrder.approved_by_name ??
            (purchaseOrder.approved_by
              ? `#${purchaseOrder.approved_by}`
              : "—")
          }
        />
        <DetailField
          label="Received By"
          value={
            purchaseOrder.received_by_name ??
            (purchaseOrder.received_by
              ? `#${purchaseOrder.received_by}`
              : "—")
          }
        />
        <DetailField
          label="Last Updated"
          value={formatDate(purchaseOrder.updated_at)}
        />
      </div>

      <Card className="border-[#e8eaed] p-5">
        <h3 className="text-base font-semibold text-[#373B44]">Description</h3>
        <p className="mt-2 text-sm text-[#5c6370]">
          {purchaseOrder.description || "No description provided."}
        </p>
      </Card>

      {purchaseOrder.order_type === "by_requisition" &&
        purchaseOrder.requisitions &&
        purchaseOrder.requisitions.length > 0 && (
          <Card className="border-[#e8eaed] p-5">
            <h3 className="text-base font-semibold text-[#373B44]">
              Linked Requisitions
            </h3>
            <ul className="mt-3 space-y-2">
              {purchaseOrder.requisitions.map(requisition => (
                <li key={requisition.id}>
                  <Link
                    href={`/requisitions/${requisition.id}`}
                    className="inline-flex flex-wrap items-center gap-2 text-sm font-medium text-[#4DC591] hover:underline"
                  >
                    {requisition.req_id}
                    {requisition.description && (
                      <span className="font-normal text-[#5c6370]">
                        — {requisition.description}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}

      <Card className="overflow-hidden border-[#e8eaed] p-0">
        <div className="border-b border-[#e8eaed] bg-[#f8f9fb] px-5 py-4">
          <h3 className="text-base font-semibold text-[#373B44]">
            Order Items
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e8eaed]">
                <th className="px-5 py-3 font-semibold text-[#373B44]">#</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Item</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Qty</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Unit</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Unit Price
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Discount
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Line Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8eaed]">
              {purchaseOrder.items.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-5 py-3.5 text-[#8b95a5]">{index + 1}</td>
                  <td className="px-5 py-3.5 font-medium text-[#373B44]">
                    {item.item_name ?? `Item #${item.item_id}`}
                  </td>
                  <td className="px-5 py-3.5 text-[#5c6370]">
                    {item.quantity}
                  </td>
                  <td className="px-5 py-3.5 text-[#5c6370]">
                    {item.unit_name ?? (item.unit_id ? `Unit #${item.unit_id}` : "—")}
                  </td>
                  <td className="px-5 py-3.5 text-[#5c6370]">
                    {formatCurrency(item.per_unit_amount)}
                  </td>
                  <td className="px-5 py-3.5 text-[#5c6370]">
                    {formatCurrency(item.discount_amount)}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-[#373B44]">
                    {formatCurrency(item.total_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[#e8eaed] bg-[#f8f9fb]">
                <td
                  colSpan={6}
                  className="px-5 py-3.5 text-right font-semibold text-[#373B44]"
                >
                  Grand Total
                </td>
                <td className="px-5 py-3.5 font-bold text-[#373B44]">
                  {formatCurrency(purchaseOrder.total_amount)}
                </td>
              </tr>
            </tfoot>
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

      <PurchaseOrderFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        purchaseOrder={purchaseOrder}
        items={items}
        units={units}
        onSuccess={fetchData}
      />

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Purchase Order</DialogTitle>
            <DialogDescription>
              Confirm approval for {purchaseOrder.po_number}.
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

      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Received</DialogTitle>
            <DialogDescription>
              Confirm goods received for {purchaseOrder.po_number}?
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
              onClick={() => setReceiveOpen(false)}
              disabled={isSubmitting}
            >
              Close
            </Button>
            <Button onClick={handleReceive} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Confirm Received
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Purchase Order</DialogTitle>
            <DialogDescription>
              Cancel {purchaseOrder.po_number}? It will be marked as cancelled.
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
              Keep Active
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="animate-spin" />}
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Delete Purchase Order</SheetTitle>
            <SheetDescription>
              Permanently delete {purchaseOrder.po_number}, all line items, and
              any attachment.
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
