"use client"

import * as React from "react"
import Link from "next/link"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Search,
} from "lucide-react"

import {
  STOCK_MOVEMENT_STATUS_LABELS,
  canApproveStockMovement,
  formatQuantity,
  getMovementStatusBadgeClass,
} from "@/components/inventory/inventory-constants"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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
import { getAuthUser } from "@/lib/auth/token"
import {
  approveStockMovement,
  getStockMovements,
} from "@/services/stock-movements"
import type { StockMovement } from "@/types/stock-movements"

export function StockMovementApprovalPageClient() {
  const authUser = getAuthUser()
  const canApprove = canApproveStockMovement(authUser)

  const [movements, setMovements] = React.useState<StockMovement[]>([])
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [appliedSearch, setAppliedSearch] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [approveOpen, setApproveOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<StockMovement | null>(null)

  const fetchMovements = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getStockMovements({
        page,
        limit: 10,
        status: "pending",
        searchTerm: appliedSearch || undefined,
      })
      setMovements(result.data)
      setTotalPages(result.meta?.totalPages ?? 1)
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load movements"
      )
      setMovements([])
    } finally {
      setIsLoading(false)
    }
  }, [appliedSearch, page])

  React.useEffect(() => {
    fetchMovements()
  }, [fetchMovements])

  const handleApprove = async () => {
    if (!selected) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      await approveStockMovement(selected.id)
      setApproveOpen(false)
      setSelected(null)
      fetchMovements()
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Failed to approve movement"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#373B44]">
          Movement Approval
        </h1>
        <p className="text-sm text-[#8b95a5]">
          Approve pending stock movement requests
        </p>
      </div>

      <form
        onSubmit={e => {
          e.preventDefault()
          setPage(1)
          setAppliedSearch(searchTerm.trim())
        }}
        className="flex gap-3"
      >
        <Input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search"
          className="max-w-sm"
        />
        <Button type="submit" variant="outline">
          <Search />
        </Button>
      </form>

      <div className="rounded-xl border border-[#e8eaed] bg-white">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#4DC591]" />
          </div>
        ) : error ? (
          <div className="px-6 py-8 text-sm text-red-600">{error}</div>
        ) : movements.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#8b95a5]">
            No pending movements
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#e8eaed] bg-[#f8f9fb]">
                  <th className="px-5 py-3 font-semibold">Movement #</th>
                  <th className="px-5 py-3 font-semibold">Route</th>
                  <th className="px-5 py-3 font-semibold">Items</th>
                  <th className="px-5 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8eaed]">
                {movements.map(m => (
                  <tr key={m.id}>
                    <td className="px-5 py-3.5 font-medium">{m.movement_number}</td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {m.source_location_name} → {m.destination_location_name}
                    </td>
                    <td className="px-5 py-3.5">
                      {m.items.map(item => (
                        <div key={item.id} className="text-xs text-[#5c6370]">
                          {item.item_name}: {formatQuantity(item.requested_quantity)}
                          {item.available_quantity != null && (
                            <span className="text-[#8b95a5]">
                              {" "}
                              (avail {formatQuantity(item.available_quantity)})
                            </span>
                          )}
                        </div>
                      ))}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/inventory/stock-movements/${m.id}`}
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                          })}
                        >
                          <Eye />
                        </Link>
                        {canApprove && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelected(m)
                              setApproveOpen(true)
                            }}
                          >
                            <CheckCircle2 />
                            Approve
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Movement</DialogTitle>
            <DialogDescription>
              Validate source location stock and approve{" "}
              {selected?.movement_number}.
            </DialogDescription>
          </DialogHeader>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
