"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  PackageMinus,
  Pencil,
  Trash2,
} from "lucide-react"

import { OutRequestFormModal } from "@/components/out-requests/out-request-form-modal"
import { OutRequestVoucherCard } from "@/components/out-requests/out-request-voucher-card"
import {
  canApproveOutRequest,
  canDeleteOutRequestRow,
  canManageOutRequest,
  canOutItem,
  canProcessOutRequestWithPermission,
  formatDate,
  formatItemStatus,
  formatStatus,
  getItemStatusBadgeClass,
  getRemainingOutQuantity,
  getStatusBadgeClass,
} from "@/components/out-requests/out-request-constants"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { getItems } from "@/services/items"
import { getLocations } from "@/services/locations"
import {
  approveOutRequest,
  deleteOutRequest,
  getOutRequest,
  processOutRequest,
} from "@/services/out-requests"
import { getUnits } from "@/services/units"
import type { Item } from "@/types/items"
import type { Location } from "@/types/locations"
import type { OutRequest, OutRequestItem } from "@/types/out-requests"
import type { Unit } from "@/types/units"

type OutRequestDetailClientProps = {
  outRequestId: number
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

export function OutRequestDetailClient({
  outRequestId,
}: OutRequestDetailClientProps) {
  const searchParams = useSearchParams()
  const showVoucherHighlight = searchParams.get("voucher") === "1"
  const fromRequestApproval =
    searchParams.get("from") === "request-approval"
  const backHref = fromRequestApproval
    ? "/outbound/request-approval"
    : "/outbound/out-request"
  const backLabel = fromRequestApproval
    ? "Back to Request Approval"
    : "Back to Out Requests"
  const authUser = getAuthUser()

  const [outRequest, setOutRequest] = React.useState<OutRequest | null>(null)
  const [items, setItems] = React.useState<Item[]>([])
  const [locations, setLocations] = React.useState<Location[]>([])
  const [units, setUnits] = React.useState<Unit[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [formError, setFormError] = React.useState<string | null>(null)

  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [approveOpen, setApproveOpen] = React.useState(false)
  const [selectedItemIds, setSelectedItemIds] = React.useState<number[]>([])
  const [outQuantities, setOutQuantities] = React.useState<
    Record<number, string>
  >({})
  const [outError, setOutError] = React.useState<string | null>(null)
  const [outingItemId, setOutingItemId] = React.useState<number | null>(null)

  const syncOutFormState = React.useCallback((request: OutRequest) => {
    const quantities: Record<number, string> = {}
    const eligibleIds: number[] = []

    for (const item of request.items) {
      if (canOutItem(item)) {
        eligibleIds.push(item.item_id)
        quantities[item.item_id] = String(getRemainingOutQuantity(item))
      }
    }

    setOutQuantities(quantities)
    setSelectedItemIds(eligibleIds)
  }, [])

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [outRequestData, itemsRes, unitsRes, locationsRes] =
        await Promise.all([
        getOutRequest(outRequestId),
        getItems({ limit: 200, sortBy: "name", sortOrder: "asc" }),
        getUnits({ limit: 100, sortBy: "name", sortOrder: "asc" }),
        getLocations({ limit: 200, sortBy: "name", sortOrder: "asc" }),
      ])

      setOutRequest(outRequestData)
      syncOutFormState(outRequestData)
      setOutError(null)
      setItems(itemsRes.data)
      setUnits(unitsRes.data)
      setLocations(locationsRes.data)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load out request"
      setError(message)
      setOutRequest(null)
    } finally {
      setIsLoading(false)
    }
  }, [outRequestId, syncOutFormState])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const eligibleItems =
    outRequest?.items.filter(item => canOutItem(item)) ?? []

  const allEligibleSelected =
    eligibleItems.length > 0 &&
    eligibleItems.every(item => selectedItemIds.includes(item.item_id))

  const toggleItemSelection = (itemId: number, checked: boolean) => {
    setSelectedItemIds(prev =>
      checked
        ? [...new Set([...prev, itemId])]
        : prev.filter(id => id !== itemId)
    )
  }

  const toggleSelectAll = (checked: boolean) => {
    setSelectedItemIds(
      checked ? eligibleItems.map(item => item.item_id) : []
    )
  }

  const buildOutPayload = (itemIds: number[]) => {
    return itemIds.map(itemId => {
      const rawQty = outQuantities[itemId]?.trim()
      const parsedQty = rawQty ? Number(rawQty) : undefined

      return {
        item_id: itemId,
        ...(parsedQty !== undefined && !Number.isNaN(parsedQty)
          ? { out_quantity: parsedQty }
          : {}),
      }
    })
  }

  const getOutQuantityError = (item: OutRequestItem) => {
    const remaining = getRemainingOutQuantity(item)
    const rawQty = outQuantities[item.item_id]?.trim()
    const qty = rawQty ? Number(rawQty) : remaining

    if (Number.isNaN(qty) || qty <= 0) {
      return "Out quantity must be greater than zero"
    }
    if (qty > remaining) {
      return `Out quantity cannot exceed remaining (${remaining})`
    }
    if (Number(item.available_quantity ?? 0) < qty) {
      return `Insufficient stock (available ${item.available_quantity ?? 0})`
    }
    return null
  }

  const selectedItemsHaveInvalidQty = (outRequest?.items ?? [])
    .filter(
      item => selectedItemIds.includes(item.item_id) && canOutItem(item)
    )
    .some(item => getOutQuantityError(item) !== null)

  const handleProcessOut = async (itemIds: number[]) => {
    if (!outRequest || !authUser || !itemIds.length) return

    const validationError = itemIds
      .map(itemId => outRequest.items.find(item => item.item_id === itemId))
      .filter((item): item is OutRequestItem => Boolean(item))
      .map(item => getOutQuantityError(item))
      .find(Boolean)

    if (validationError) {
      setOutError(validationError)
      return
    }

    setIsSubmitting(true)
    setOutError(null)
    setOutingItemId(itemIds.length === 1 ? itemIds[0] : null)

    try {
      await processOutRequest(outRequest.id, {
        out_by: authUser.id,
        items: buildOutPayload(itemIds),
      })
      await fetchData()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to process outbound items"
      setOutError(message)
    } finally {
      setIsSubmitting(false)
      setOutingItemId(null)
    }
  }

  const handleApprove = async () => {
    if (!outRequest) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await approveOutRequest(outRequest.id)
      setApproveOpen(false)
      await fetchData()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to approve out request"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!outRequest) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await deleteOutRequest(outRequest.id)
      window.location.href = backHref
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

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-[#4DC591]" />
      </div>
    )
  }

  if (error || !outRequest) {
    return (
      <div className="space-y-4">
        <Link
          href={backHref}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600">
          {error ?? "Out request not found"}
        </div>
      </div>
    )
  }

  const isOwner = authUser?.id === outRequest.requested_by
  const canEdit = isOwner && canManageOutRequest(outRequest.status)
  const canApprove = canApproveOutRequest(authUser, outRequest.status)
  const canDelete = canDeleteOutRequestRow(
    authUser,
    outRequest.status,
    isOwner
  )
  const showOutControls = canProcessOutRequestWithPermission(
    authUser,
    outRequest.status
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Link
            href={backHref}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-[#373B44]">
                {outRequest.request_id}
              </h2>
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                  getStatusBadgeClass(outRequest.status)
                )}
              >
                {formatStatus(outRequest.status)}
              </span>
            </div>
            <p className="mt-1 text-[#8b95a5]">
              Out request details and printable voucher
            </p>
          </div>
        </div>

        {(canApprove || canEdit || canDelete) && (
          <div className="flex gap-2">
            {canApprove && (
              <Button onClick={() => setApproveOpen(true)}>
                <CheckCircle2 className="size-4" />
                Approve
              </Button>
            )}
            {canEdit && (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                Edit
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                onClick={() => setDeleteOpen(true)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      <OutRequestVoucherCard
        outRequest={outRequest}
        highlight={showVoucherHighlight}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DetailField
          label="Requested By"
          value={outRequest.requested_by_name ?? `User #${outRequest.requested_by}`}
        />
        <DetailField
          label="Approved By"
          value={
            outRequest.approved_by_name ??
            (outRequest.approved_by
              ? `User #${outRequest.approved_by}`
              : "Pending approval")
          }
        />
        <DetailField
          label="Out By"
          value={
            outRequest.out_by_name ??
            (outRequest.out_by ? `User #${outRequest.out_by}` : "—")
          }
        />
        <DetailField label="Created" value={formatDate(outRequest.created_at)} />
        <DetailField
          label="Last Updated"
          value={formatDate(outRequest.updated_at)}
        />
        <DetailField label="Line Items" value={outRequest.items.length} />
      </div>

      <Card className="border-[#e8eaed] p-5">
        <h3 className="mb-2 text-base font-semibold text-[#373B44]">
          Description
        </h3>
        <p className="text-sm text-[#5c6370]">
          {outRequest.description?.trim() || "No description provided."}
        </p>
      </Card>

      <Card className="overflow-hidden border-[#e8eaed] p-0">
        <div className="flex flex-col gap-3 border-b border-[#e8eaed] bg-[#f8f9fb] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#373B44]">
              Requested Items
            </h3>
            {showOutControls && (
              <p className="mt-1 text-sm text-[#8b95a5]">
                Select items and set out quantity, then process outbound stock.
              </p>
            )}
          </div>
          {showOutControls && eligibleItems.length > 0 && (
            <Button
              onClick={() => void handleProcessOut(selectedItemIds)}
              disabled={
                isSubmitting ||
                selectedItemIds.length === 0 ||
                selectedItemsHaveInvalidQty
              }
            >
              {isSubmitting && outingItemId === null ? (
                <Loader2 className="animate-spin" />
              ) : (
                <PackageMinus />
              )}
              Out Selected ({selectedItemIds.length})
            </Button>
          )}
        </div>

        {outError && (
          <div className="border-b border-[#e8eaed] bg-red-50 px-5 py-3 text-sm text-red-600">
            {outError}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-[#e8eaed]">
              <tr>
                {showOutControls && (
                  <th className="px-5 py-3 font-medium text-[#8b95a5]">
                    <input
                      type="checkbox"
                      checked={allEligibleSelected}
                      onChange={e => toggleSelectAll(e.target.checked)}
                      disabled={isSubmitting || eligibleItems.length === 0}
                      aria-label="Select all eligible items"
                      className="size-4 rounded border-[#d5dae1]"
                    />
                  </th>
                )}
                <th className="px-5 py-3 font-medium text-[#8b95a5]">Item</th>
                <th className="px-5 py-3 font-medium text-[#8b95a5]">
                  Requested Qty
                </th>
                <th className="px-5 py-3 font-medium text-[#8b95a5]">
                  Out Qty
                </th>
                <th className="px-5 py-3 font-medium text-[#8b95a5]">Unit</th>
                <th className="px-5 py-3 font-medium text-[#8b95a5]">
                  Location Stock
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Total Stock
                </th>
                <th className="px-5 py-3 font-medium text-[#8b95a5]">
                  Remaining
                </th>
                <th className="px-5 py-3 font-medium text-[#8b95a5]">
                  Item Status
                </th>
                {showOutControls && (
                  <>
                    <th className="px-5 py-3 font-medium text-[#8b95a5]">
                      Out Now
                    </th>
                    <th className="px-5 py-3 text-right font-medium text-[#8b95a5]">
                      Action
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {outRequest.items.map((item: OutRequestItem) => {
                const remaining = getRemainingOutQuantity(item)
                const itemCanOut = canOutItem(item)
                const outQty = Number(outQuantities[item.item_id] || remaining)
                const qtyInvalid =
                  showOutControls &&
                  itemCanOut &&
                  (Number.isNaN(outQty) ||
                    outQty <= 0 ||
                    outQty > remaining ||
                    Number(item.available_quantity ?? 0) < outQty)

                return (
                  <tr key={item.id} className="border-b border-[#e8eaed]">
                    {showOutControls && (
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={selectedItemIds.includes(item.item_id)}
                          onChange={e =>
                            toggleItemSelection(item.item_id, e.target.checked)
                          }
                          disabled={isSubmitting || !itemCanOut}
                          aria-label={`Select ${item.item_name ?? "item"}`}
                          className="size-4 rounded border-[#d5dae1]"
                        />
                      </td>
                    )}
                    <td className="px-5 py-4 font-medium text-[#373B44]">
                      {item.item_name ?? `Item #${item.item_id}`}
                    </td>
                    <td className="px-5 py-4 text-[#5c6370]">
                      {item.requested_quantity}
                    </td>
                    <td className="px-5 py-4 text-[#5c6370]">
                      {item.out_quantity ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-[#5c6370]">
                      {item.unit_name ?? "—"}
                    </td>
                    <td
                      className={cn(
                        "px-5 py-4",
                        qtyInvalid
                          ? "font-medium text-red-600"
                          : "text-[#5c6370]"
                      )}
                    >
                      {item.available_quantity ?? 0}
                    </td>
                    <td className="px-5 py-4 text-[#5c6370]">
                      {item.total_available_quantity ?? 0}
                    </td>
                    <td className="px-5 py-4 text-[#5c6370]">{remaining}</td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                          getItemStatusBadgeClass(item.status)
                        )}
                      >
                        {formatItemStatus(item.status)}
                      </span>
                    </td>
                    {showOutControls && (
                      <>
                        <td className="px-5 py-4">
                          {itemCanOut ? (
                            <Input
                              type="number"
                              min="0.01"
                              step="any"
                              max={remaining}
                              value={outQuantities[item.item_id] ?? ""}
                              onChange={e =>
                                setOutQuantities(prev => ({
                                  ...prev,
                                  [item.item_id]: e.target.value,
                                }))
                              }
                              className={cn(
                                "h-9 w-28",
                                qtyInvalid && "border-red-300"
                              )}
                              disabled={isSubmitting}
                              aria-label={`Out quantity for ${item.item_name ?? "item"}`}
                            />
                          ) : (
                            <span className="text-[#8b95a5]">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {itemCanOut ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                void handleProcessOut([item.item_id])
                              }
                              disabled={isSubmitting || qtyInvalid}
                            >
                              {isSubmitting &&
                              outingItemId === item.item_id ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                <PackageMinus />
                              )}
                              Out
                            </Button>
                          ) : (
                            <span className="text-xs text-[#8b95a5]">
                              Completed
                            </span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <OutRequestFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        outRequest={outRequest}
        items={items}
        units={units}
        locations={locations}
        onSuccess={fetchData}
      />

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Out Request</DialogTitle>
            <DialogDescription>
              Approve {outRequest.request_id}? The requester can proceed with
              outbound processing after approval.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </DialogBody>
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
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Delete Out Request</SheetTitle>
            <SheetDescription>
              Delete {outRequest.request_id}? This cannot be undone.
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
