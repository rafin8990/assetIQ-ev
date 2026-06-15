"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Truck } from "lucide-react"

import {
  STOCK_MOVEMENT_STATUS_LABELS,
  canConfirmStockMovement,
  canReadyStockMovement,
  canTransferStockMovement,
  formatQuantity,
  getMovementStatusBadgeClass,
} from "@/components/inventory/inventory-constants"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api/client"
import { getAuthUser } from "@/lib/auth/token"
import {
  cancelStockMovement,
  confirmStockMovement,
  getStockMovement,
  readyStockMovement,
  transferStockMovement,
} from "@/services/stock-movements"
import type { StockMovement } from "@/types/stock-movements"

type Props = {
  movementId: number
}

export function StockMovementDetailClient({ movementId }: Props) {
  const authUser = getAuthUser()
  const canReady = canReadyStockMovement(authUser)
  const canTransfer = canTransferStockMovement(authUser)
  const canConfirm = canConfirmStockMovement(authUser)

  const [movement, setMovement] = React.useState<StockMovement | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [actionError, setActionError] = React.useState<string | null>(null)

  const fetchMovement = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getStockMovement(movementId)
      setMovement(result)
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load movement"
      )
      setMovement(null)
    } finally {
      setIsLoading(false)
    }
  }, [movementId])

  React.useEffect(() => {
    fetchMovement()
  }, [fetchMovement])

  const runAction = async (
    action: () => Promise<StockMovement>,
    label: string
  ) => {
    setIsSubmitting(true)
    setActionError(null)

    try {
      const result = await action()
      setMovement(result)
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : `Failed to ${label}`
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#4DC591]" />
      </div>
    )
  }

  if (error || !movement) {
    return (
      <div className="space-y-4">
        <Link
          href="/inventory/stock-movements"
          className="inline-flex items-center gap-2 text-sm text-[#4DC591]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to movements
        </Link>
        <p className="text-sm text-red-600">{error ?? "Movement not found"}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/inventory/stock-movements"
            className="mb-2 inline-flex items-center gap-2 text-sm text-[#4DC591]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className="text-2xl font-semibold text-[#373B44]">
            {movement.movement_number}
          </h1>
          <p className="text-sm text-[#8b95a5]">
            {movement.source_location_name} → {movement.destination_location_name}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            getMovementStatusBadgeClass(movement.status)
          )}
        >
          {STOCK_MOVEMENT_STATUS_LABELS[movement.status]}
        </span>
      </div>

      {actionError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {actionError}
        </div>
      )}

      <div className="rounded-xl border border-[#e8eaed] bg-white p-5">
        <div className="mb-4 grid gap-4 text-sm md:grid-cols-2">
          <div>
            <p className="text-[#8b95a5]">Requested by</p>
            <p className="font-medium text-[#373B44]">
              {movement.requested_by_name ?? `#${movement.requested_by}`}
            </p>
          </div>
          {movement.notes && (
            <div>
              <p className="text-[#8b95a5]">Notes</p>
              <p className="text-[#373B44]">{movement.notes}</p>
            </div>
          )}
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e8eaed] text-left text-[#8b95a5]">
              <th className="pb-3 font-medium">Item</th>
              <th className="pb-3 font-medium">Requested</th>
              <th className="pb-3 font-medium">Ready</th>
              <th className="pb-3 font-medium">Transferred</th>
              <th className="pb-3 font-medium">Confirmed</th>
              <th className="pb-3 font-medium">Available</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8eaed]">
            {movement.items.map(item => (
              <tr key={item.id}>
                <td className="py-3 font-medium text-[#373B44]">
                  {item.item_name}
                </td>
                <td className="py-3 text-[#5c6370]">
                  {formatQuantity(item.requested_quantity)}
                </td>
                <td className="py-3 text-[#5c6370]">
                  {formatQuantity(item.ready_quantity)}
                </td>
                <td className="py-3 text-[#5c6370]">
                  {formatQuantity(item.transferred_quantity)}
                </td>
                <td className="py-3 text-[#5c6370]">
                  {formatQuantity(item.confirmed_quantity)}
                </td>
                <td className="py-3 text-[#5c6370]">
                  {item.available_quantity != null
                    ? formatQuantity(item.available_quantity)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-3">
        {movement.status === "approved" && canReady && (
          <Button
            disabled={isSubmitting}
            onClick={() =>
              runAction(() => readyStockMovement(movement.id), "mark ready")
            }
          >
            {isSubmitting && <Loader2 className="animate-spin" />}
            Mark Ready
          </Button>
        )}
        {(movement.status === "ready" || movement.status === "in_transit") &&
          canTransfer && (
            <Button
              disabled={isSubmitting}
              onClick={() =>
                runAction(
                  () => transferStockMovement(movement.id),
                  "transfer"
                )
              }
            >
              {isSubmitting && <Loader2 className="animate-spin" />}
              <Truck />
              Dispatch Transfer
            </Button>
          )}
        {movement.status === "in_transit" && canConfirm && (
          <Button
            disabled={isSubmitting}
            onClick={() =>
              runAction(() => confirmStockMovement(movement.id), "confirm")
            }
          >
            {isSubmitting && <Loader2 className="animate-spin" />}
            Confirm All at Destination
          </Button>
        )}
        {movement.status !== "completed" &&
          movement.status !== "cancelled" && (
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() =>
                runAction(() => cancelStockMovement(movement.id), "cancel")
              }
            >
              Cancel
            </Button>
          )}
      </div>
    </div>
  )
}
