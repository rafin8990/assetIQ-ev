"use client"

import * as React from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  PackageCheck,
} from "lucide-react"

import {
  formatQuantity,
  canConfirmStockMovement,
} from "@/components/inventory/inventory-constants"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api/client"
import { getAuthUser } from "@/lib/auth/token"
import {
  confirmStockMovement,
  getStockMovements,
} from "@/services/stock-movements"
import type { StockMovement } from "@/types/stock-movements"

export function StockMovementConfirmPageClient() {
  const canConfirm = canConfirmStockMovement(getAuthUser())

  const [movements, setMovements] = React.useState<StockMovement[]>([])
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [confirmInputs, setConfirmInputs] = React.useState<
    Record<number, Record<number, string>>
  >({})
  const [formError, setFormError] = React.useState<string | null>(null)

  const fetchMovements = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getStockMovements({
        page,
        limit: 10,
        status: "in_transit",
      })
      setMovements(result.data)
      setTotalPages(result.meta?.totalPages ?? 1)
      setConfirmInputs({})
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load movements"
      )
      setMovements([])
    } finally {
      setIsLoading(false)
    }
  }, [page])

  React.useEffect(() => {
    fetchMovements()
  }, [fetchMovements])

  const handleConfirm = async (movement: StockMovement) => {
    const inputs = confirmInputs[movement.id] ?? {}
    const items = movement.items
      .filter(item => {
        const val = inputs[item.item_id]
        return val && Number(val) > 0
      })
      .map(item => ({
        item_id: item.item_id,
        quantity: Number(inputs[item.item_id]),
      }))

    if (!items.length) {
      setFormError("Enter confirm quantity for at least one item")
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      await confirmStockMovement(movement.id, { items })
      fetchMovements()
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Failed to confirm movement"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#373B44]">
          Destination Confirm
        </h1>
        <p className="text-sm text-[#8b95a5]">
          Confirm received quantities for in-transit movements
        </p>
      </div>

      {formError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {formError}
        </div>
      )}

      <div className="rounded-xl border border-[#e8eaed] bg-white">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#4DC591]" />
          </div>
        ) : error ? (
          <div className="px-6 py-8 text-sm text-red-600">{error}</div>
        ) : movements.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-[#8b95a5]">
            <PackageCheck className="h-10 w-10" />
            <p>No movements awaiting confirmation</p>
          </div>
        ) : (
          <div className="divide-y divide-[#e8eaed]">
            {movements.map(movement => (
              <div key={movement.id} className="p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#373B44]">
                      {movement.movement_number}
                    </p>
                    <p className="text-sm text-[#8b95a5]">
                      {movement.source_location_name} →{" "}
                      {movement.destination_location_name}
                    </p>
                  </div>
                  <Link
                    href={`/inventory/stock-movements/${movement.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <Eye />
                    Details
                  </Link>
                </div>
                <table className="mb-4 w-full text-sm">
                  <thead>
                    <tr className="text-left text-[#8b95a5]">
                      <th className="pb-2 font-medium">Item</th>
                      <th className="pb-2 font-medium">Transferred</th>
                      <th className="pb-2 font-medium">Confirmed</th>
                      <th className="pb-2 font-medium">Confirm Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movement.items.map(item => {
                      const remaining =
                        Number(item.transferred_quantity) -
                        Number(item.confirmed_quantity)

                      return (
                        <tr key={item.id}>
                          <td className="py-2 text-[#373B44]">
                            {item.item_name}
                          </td>
                          <td className="py-2 text-[#5c6370]">
                            {formatQuantity(item.transferred_quantity)}
                          </td>
                          <td className="py-2 text-[#5c6370]">
                            {formatQuantity(item.confirmed_quantity)}
                          </td>
                          <td className="py-2">
                            <Input
                              type="number"
                              min={0}
                              max={remaining}
                              step="any"
                              className="h-8 w-24"
                              disabled={remaining <= 0 || isSubmitting}
                              value={
                                confirmInputs[movement.id]?.[item.item_id] ?? ""
                              }
                              onChange={e =>
                                setConfirmInputs(current => ({
                                  ...current,
                                  [movement.id]: {
                                    ...(current[movement.id] ?? {}),
                                    [item.item_id]: e.target.value,
                                  },
                                }))
                              }
                              placeholder={
                                remaining > 0 ? String(remaining) : "0"
                              }
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {canConfirm && (
                  <Button
                    onClick={() => handleConfirm(movement)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="animate-spin" />}
                    Confirm Receipt
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-end gap-2 border-t border-[#e8eaed] px-5 py-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
