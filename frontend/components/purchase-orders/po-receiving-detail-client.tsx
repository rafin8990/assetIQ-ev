"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, RotateCcw } from "lucide-react"

import { selectClassName } from "@/components/inventory/inventory-constants"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api/client"
import {
  formatDate,
  formatStatus,
  formatVendorDisplay,
  getStatusBadgeClass,
} from "@/components/purchase-orders/purchase-order-constants"
import {
  acceptStagingToStock,
  getStagingDetail,
  recordStagingReceipt,
  returnToVendor,
} from "@/services/purchase-orders"
import { getLocations } from "@/services/locations"
import type { Location } from "@/types/locations"
import type { StagingPurchaseOrder } from "@/types/purchase-order-staging"

type PoReceivingDetailClientProps = {
  purchaseOrderId: number
}

export function PoReceivingDetailClient({
  purchaseOrderId,
}: PoReceivingDetailClientProps) {
  const [detail, setDetail] = React.useState<StagingPurchaseOrder | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [formError, setFormError] = React.useState<string | null>(null)

  const [receiveInputs, setReceiveInputs] = React.useState<
    Record<number, string>
  >({})
  const [acceptInputs, setAcceptInputs] = React.useState<
    Record<number, string>
  >({})
  const [acceptLocationInputs, setAcceptLocationInputs] = React.useState<
    Record<number, string>
  >({})
  const [locations, setLocations] = React.useState<Location[]>([])
  const [returnOpen, setReturnOpen] = React.useState(false)
  const [returnItemId, setReturnItemId] = React.useState<number | null>(null)
  const [returnQty, setReturnQty] = React.useState("")
  const [returnReason, setReturnReason] = React.useState("")

  const fetchDetail = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getStagingDetail(purchaseOrderId)
      setDetail(result)
      setReceiveInputs({})
      setAcceptInputs({})
      setAcceptLocationInputs({})
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load staging detail"
      setError(message)
      setDetail(null)
    } finally {
      setIsLoading(false)
    }
  }, [purchaseOrderId])

  React.useEffect(() => {
    getLocations({ limit: 200, sortBy: "name", sortOrder: "asc" })
      .then(res => setLocations(res.data))
      .catch(() => setLocations([]))
  }, [])

  React.useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  const handleRecordReceipt = async () => {
    if (!detail) return

    const items = detail.items
      .map(item => ({
        po_item_id: item.id,
        quantity: Number(receiveInputs[item.id] ?? 0),
      }))
      .filter(item => item.quantity > 0)

    if (!items.length) {
      setFormError("Enter a received quantity for at least one item")
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      const updated = await recordStagingReceipt(detail.id, items)
      setDetail(updated)
      setReceiveInputs({})
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.errorMessages?.[0]?.message || err.message
          : err instanceof Error
            ? err.message
            : "Failed to record receipt"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAcceptToStock = async () => {
    if (!detail) return

    const items = detail.items
      .map(item => ({
        po_item_id: item.id,
        quantity: Number(acceptInputs[item.id] ?? 0),
        location_id: Number(acceptLocationInputs[item.id] ?? 0),
      }))
      .filter(item => item.quantity > 0)

    if (!items.length) {
      setFormError("Enter an accept quantity for at least one item")
      return
    }

    const missingLocation = items.find(item => !item.location_id)
    if (missingLocation) {
      setFormError("Select a destination location for each item being accepted")
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      const updated = await acceptStagingToStock(detail.id, { items })
      setDetail(updated)
      setAcceptInputs({})
      setAcceptLocationInputs({})
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.errorMessages?.[0]?.message || err.message
          : err instanceof Error
            ? err.message
            : "Failed to accept stock"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openReturnDialog = (poItemId: number) => {
    setReturnItemId(poItemId)
    setReturnQty("")
    setReturnReason("")
    setFormError(null)
    setReturnOpen(true)
  }

  const handleReturnToVendor = async () => {
    if (!detail || !returnItemId) return

    const quantity = Number(returnQty)
    const reason = returnReason.trim()

    if (!quantity || quantity <= 0) {
      setFormError("Return quantity must be greater than zero")
      return
    }

    if (!reason) {
      setFormError("Return reason is required")
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      const updated = await returnToVendor(detail.id, [
        { po_item_id: returnItemId, quantity, reason },
      ])
      setDetail(updated)
      setReturnOpen(false)
      setReturnItemId(null)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.errorMessages?.[0]?.message || err.message
          : err instanceof Error
            ? err.message
            : "Failed to return items to vendor"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center gap-2 text-[#8b95a5]">
        <Loader2 className="size-4 animate-spin" />
        Loading receiving details...
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <Link
          href="/procurement/po-receiving"
          className="inline-flex items-center gap-2 text-sm text-[#4DC591] hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to PO Receiving
        </Link>
        <p className="text-sm text-red-600">
          {error ?? "Purchase order not found"}
        </p>
      </div>
    )
  }

  const progressPercent =
    detail.total_lines > 0
      ? Math.round((detail.fully_received_lines / detail.total_lines) * 100)
      : 0

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/procurement/po-receiving"
          className="mb-3 inline-flex items-center gap-2 text-sm text-[#4DC591] hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to PO Receiving
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#373B44]">
              {detail.po_number}
            </h2>
            <p className="text-[#8b95a5]">{formatVendorDisplay(detail)}</p>
            <Link
              href={`/purchase-orders/${detail.id}`}
              className="mt-1 inline-block text-xs text-[#4DC591] hover:underline"
            >
              View full PO details
            </Link>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(detail.status)}`}
          >
            {formatStatus(detail.status)}
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
        <div className="border-b border-[#e8eaed] px-5 py-4">
          <div className="mb-1 flex justify-between text-xs text-[#8b95a5]">
            <span>Receive progress</span>
            <span>
              {detail.fully_received_lines}/{detail.total_lines} lines complete
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#f0f2f5]">
            <div
              className="h-full rounded-full bg-[#4DC591] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e8eaed] bg-[#f8f9fb]">
                <th className="px-5 py-3 font-semibold text-[#373B44]">Item</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Ordered
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Received
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Returned
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  In Staging
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Accepted
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Add Qty
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Accept Qty
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Destination
                </th>
                <th className="px-5 py-3 text-right font-semibold text-[#373B44]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8eaed]">
              {detail.items.map(item => (
                <tr key={item.id}>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-[#373B44]">
                      {item.item_name ?? `Item #${item.item_id}`}
                    </p>
                    <p className="text-xs text-[#8b95a5]">
                      {item.is_line_fully_received ? "Fully received" : "Partial"}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-[#5c6370]">
                    {item.ordered_quantity}
                    {item.unit_name ? ` ${item.unit_name}` : ""}
                  </td>
                  <td className="px-5 py-3.5 text-[#5c6370]">
                    {item.received_quantity}
                  </td>
                  <td className="px-5 py-3.5 text-[#5c6370]">
                    {item.returned_quantity}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-[#373B44]">
                    {item.in_staging_quantity}
                  </td>
                  <td className="px-5 py-3.5 text-[#5c6370]">
                    {item.accepted_quantity}
                  </td>
                  <td className="px-5 py-3.5">
                    <Input
                      type="number"
                      min={0}
                      max={item.ordered_quantity - item.received_quantity}
                      step="any"
                      value={receiveInputs[item.id] ?? ""}
                      onChange={event =>
                        setReceiveInputs(current => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      placeholder="0"
                      className="h-8 w-24"
                      disabled={
                        isSubmitting ||
                        item.received_quantity >= item.ordered_quantity
                      }
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <Input
                      type="number"
                      min={0}
                      max={item.in_staging_quantity}
                      step="any"
                      value={acceptInputs[item.id] ?? ""}
                      onChange={event =>
                        setAcceptInputs(current => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      placeholder="0"
                      className="h-8 w-24"
                      disabled={
                        isSubmitting || item.in_staging_quantity <= 0
                      }
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={acceptLocationInputs[item.id] ?? ""}
                      onChange={event =>
                        setAcceptLocationInputs(current => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      className={`${selectClassName} h-8 min-w-[140px]`}
                      disabled={
                        isSubmitting || item.in_staging_quantity <= 0
                      }
                    >
                      <option value="">Select location</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isSubmitting || item.in_staging_quantity <= 0}
                      onClick={() => openReturnDialog(item.id)}
                    >
                      <RotateCcw />
                      Return
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {formError && !returnOpen && (
          <div className="border-t border-[#e8eaed] bg-red-50 px-5 py-3 text-sm text-red-600">
            {formError}
          </div>
        )}

        <div className="space-y-4 border-t border-[#e8eaed] px-5 py-4">
          <Button onClick={handleRecordReceipt} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Record Received Quantities
          </Button>

          <div className="rounded-lg border border-[#e8eaed] bg-[#fafbfc] p-4">
            <h4 className="mb-2 text-sm font-semibold text-[#373B44]">
              Accept to Stock
            </h4>
            <p className="mb-3 text-xs text-[#8b95a5]">
              Enter accept quantity and pick a destination location per line
              item.
            </p>
            <Button onClick={handleAcceptToStock} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Accept Staging to Stock
            </Button>
          </div>
        </div>

        {detail.returns && detail.returns.length > 0 && (
          <div className="border-t border-[#e8eaed] px-5 py-4">
            <h4 className="mb-3 text-sm font-semibold text-[#373B44]">
              Return History
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e8eaed] text-[#8b95a5]">
                    <th className="pb-2 font-medium">Item</th>
                    <th className="pb-2 font-medium">Qty</th>
                    <th className="pb-2 font-medium">Reason</th>
                    <th className="pb-2 font-medium">By</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8eaed]">
                  {detail.returns.map(ret => (
                    <tr key={ret.id}>
                      <td className="py-2 text-[#373B44]">
                        {ret.item_name ?? `Item #${ret.po_item_id}`}
                      </td>
                      <td className="py-2 text-[#5c6370]">{ret.quantity}</td>
                      <td className="py-2 text-[#5c6370]">{ret.reason}</td>
                      <td className="py-2 text-[#5c6370]">
                        {ret.returned_by_name ?? `#${ret.returned_by}`}
                      </td>
                      <td className="py-2 text-[#8b95a5]">
                        {formatDate(ret.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return to Vendor</DialogTitle>
            <DialogDescription>
              Record defective or damaged items being returned to the vendor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#373B44]">
                Quantity
              </label>
              <Input
                type="number"
                min={0}
                step="any"
                value={returnQty}
                onChange={event => setReturnQty(event.target.value)}
                placeholder="Enter quantity to return"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#373B44]">
                Reason
              </label>
              <Input
                value={returnReason}
                onChange={event => setReturnReason(event.target.value)}
                placeholder="e.g. Damaged packaging, defective unit"
              />
            </div>
            {formError && returnOpen && (
              <p className="text-sm text-red-600">{formError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReturnOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReturnToVendor}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="animate-spin" />}
              Confirm Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
