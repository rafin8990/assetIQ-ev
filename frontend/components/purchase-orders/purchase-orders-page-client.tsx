"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Loader2,
  PackageCheck,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  XCircle,
} from "lucide-react"

import { PurchaseOrderFormModal } from "@/components/purchase-orders/purchase-order-form-modal"
import {
  canApprovePurchaseOrder,
  canCancelPurchaseOrder,
  canManagePurchaseOrder,
  canReceivePurchaseOrder,
  formatCurrency,
  formatDate,
  formatOrderType,
  formatStatus,
  formatVendorDisplay,
  getStatusBadgeClass,
  selectClassName,
  STATUS_TABS,
} from "@/components/purchase-orders/purchase-order-constants"
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
  approvePurchaseOrder,
  cancelPurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrder,
  getPurchaseOrders,
} from "@/services/purchase-orders"
import { getUnits } from "@/services/units"
import { getVendors } from "@/services/vendors"
import type { Item } from "@/types/items"
import type {
  PurchaseOrder,
  PurchaseOrderStatus,
} from "@/types/purchase-orders"
import type { Unit } from "@/types/units"
import type { Vendor } from "@/types/vendors"

type StatusCounts = {
  pending: number
  approved: number
  fullyReceived: number
  cancelled: number
}

export function PurchaseOrdersPageClient() {
  const router = useRouter()
  const authUser = getAuthUser()

  const [purchaseOrders, setPurchaseOrders] = React.useState<PurchaseOrder[]>(
    []
  )
  const [items, setItems] = React.useState<Item[]>([])
  const [units, setUnits] = React.useState<Unit[]>([])
  const [vendors, setVendors] = React.useState<Vendor[]>([])
  const [statusCounts, setStatusCounts] = React.useState<StatusCounts>({
    pending: 0,
    approved: 0,
    fullyReceived: 0,
    cancelled: 0,
  })

  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [appliedSearch, setAppliedSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<
    PurchaseOrderStatus | "all"
  >("all")
  const [appliedStatus, setAppliedStatus] = React.useState<
    PurchaseOrderStatus | "all"
  >("all")

  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [formError, setFormError] = React.useState<string | null>(null)

  const [formOpen, setFormOpen] = React.useState(false)
  const [formMode, setFormMode] = React.useState<"create" | "edit">("create")
  const [selectedPo, setSelectedPo] = React.useState<PurchaseOrder | null>(null)

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [poToDelete, setPoToDelete] = React.useState<PurchaseOrder | null>(null)
  const [approveOpen, setApproveOpen] = React.useState(false)
  const [poToApprove, setPoToApprove] = React.useState<PurchaseOrder | null>(
    null
  )
  const [cancelOpen, setCancelOpen] = React.useState(false)
  const [poToCancel, setPoToCancel] = React.useState<PurchaseOrder | null>(null)

  const fetchLookups = React.useCallback(async () => {
    try {
      const [itemsRes, unitsRes, vendorsRes] = await Promise.all([
        getItems({ limit: 200, sortBy: "name", sortOrder: "asc" }),
        getUnits({ limit: 100, sortBy: "name", sortOrder: "asc" }),
        getVendors({ limit: 200, sortBy: "vendor_name", sortOrder: "asc" }),
      ])
      setItems(itemsRes.data)
      setUnits(unitsRes.data)
      setVendors(vendorsRes.data)
    } catch {
      setItems([])
      setUnits([])
      setVendors([])
    }
  }, [])

  const fetchStatusCounts = React.useCallback(async () => {
    try {
      const [pendingRes, approvedRes, fullyReceivedRes, cancelledRes] =
        await Promise.all([
          getPurchaseOrders({ status: "pending", limit: 1 }),
          getPurchaseOrders({ status: "approved", limit: 1 }),
          getPurchaseOrders({ status: "fully_received", limit: 1 }),
          getPurchaseOrders({ status: "cancelled", limit: 1 }),
        ])

      setStatusCounts({
        pending: pendingRes.meta?.total ?? 0,
        approved: approvedRes.meta?.total ?? 0,
        fullyReceived: fullyReceivedRes.meta?.total ?? 0,
        cancelled: cancelledRes.meta?.total ?? 0,
      })
    } catch {
      setStatusCounts({ pending: 0, approved: 0, fullyReceived: 0, cancelled: 0 })
    }
  }, [])

  const fetchPurchaseOrders = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getPurchaseOrders({
        page,
        limit: 10,
        sortBy: "created_at",
        sortOrder: "desc",
        searchTerm: appliedSearch || undefined,
        status: appliedStatus === "all" ? undefined : appliedStatus,
      })

      setPurchaseOrders(result.data)
      setTotal(result.meta?.total ?? 0)
      setTotalPages(result.meta?.totalPages ?? 1)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load purchase orders"
      setError(message)
      setPurchaseOrders([])
    } finally {
      setIsLoading(false)
    }
  }, [appliedSearch, appliedStatus, page])

  const refreshAll = React.useCallback(async () => {
    await Promise.all([fetchPurchaseOrders(), fetchStatusCounts()])
  }, [fetchPurchaseOrders, fetchStatusCounts])

  React.useEffect(() => {
    fetchLookups()
  }, [fetchLookups])

  React.useEffect(() => {
    fetchPurchaseOrders()
  }, [fetchPurchaseOrders])

  React.useEffect(() => {
    fetchStatusCounts()
  }, [fetchStatusCounts])

  const openCreateModal = () => {
    setFormMode("create")
    setSelectedPo(null)
    setFormOpen(true)
  }

  const openEditModal = async (po: PurchaseOrder) => {
    setFormMode("edit")
    setFormError(null)

    try {
      const full = await getPurchaseOrder(po.id)
      setSelectedPo(full)
      setFormOpen(true)
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load purchase order for editing"
      setError(message)
    }
  }

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    setPage(1)
    setAppliedSearch(searchTerm.trim())
    setAppliedStatus(statusFilter)
  }

  const handleStatusTab = (value: PurchaseOrderStatus | "all") => {
    setStatusFilter(value)
    setAppliedStatus(value)
    setPage(1)
  }

  const handleDelete = async () => {
    if (!poToDelete) return
    setIsSubmitting(true)
    setFormError(null)

    try {
      await deletePurchaseOrder(poToDelete.id)
      setDeleteOpen(false)
      setPoToDelete(null)

      if (purchaseOrders.length === 1 && page > 1) {
        setPage(current => current - 1)
      } else {
        await refreshAll()
      }
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to delete purchase order"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async () => {
    if (!poToApprove || !authUser) return
    setIsSubmitting(true)
    setFormError(null)

    try {
      await approvePurchaseOrder(poToApprove.id, authUser.id)
      setApproveOpen(false)
      setPoToApprove(null)
      await refreshAll()
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to approve purchase order"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async () => {
    if (!poToCancel) return
    setIsSubmitting(true)
    setFormError(null)

    try {
      await cancelPurchaseOrder(poToCancel.id)
      setCancelOpen(false)
      setPoToCancel(null)
      await refreshAll()
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to cancel purchase order"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#373B44]">
            Purchase Orders
          </h2>
          <p className="text-[#8b95a5]">
            Create, approve, and manage purchase orders. Record deliveries in PO
            Receiving.
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus data-icon="inline-start" />
          New Purchase Order
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Pending", value: statusCounts.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Approved", value: statusCounts.approved, icon: CheckCircle2, color: "text-[#4DC591]", bg: "bg-[#e8f8f0]" },
          { label: "Fully Received", value: statusCounts.fullyReceived, icon: PackageCheck, color: "text-teal-600", bg: "bg-teal-50" },
          { label: "Cancelled", value: statusCounts.cancelled, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-xl border border-[#e8eaed] bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg",
                  stat.bg
                )}
              >
                <stat.icon className={cn("size-5", stat.color)} />
              </div>
              <div>
                <p className="text-sm text-[#8b95a5]">{stat.label}</p>
                <p className="text-2xl font-bold text-[#373B44]">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e8eaed] bg-white shadow-sm">
        <div className="border-b border-[#e8eaed] bg-gradient-to-r from-[#373B44] to-[#4a4f5c] px-5 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="size-5 text-[#4DC591]" />
              <div>
                <h3 className="text-base font-semibold text-white">
                  All Purchase Orders
                </h3>
                <p className="text-sm text-white/70">
                  {total} order{total === 1 ? "" : "s"} total
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
                  placeholder="Search by PO number, description..."
                  className="h-9 border-[#e8eaed] bg-white pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e =>
                  setStatusFilter(e.target.value as PurchaseOrderStatus | "all")
                }
                className={cn(selectClassName, "sm:w-44")}
              >
                {STATUS_TABS.map(tab => (
                  <option key={tab.value} value={tab.value}>
                    {tab.label}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="outline" className="bg-white">
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
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e8eaed] bg-[#f8f9fb]">
                <th className="px-5 py-3 font-semibold text-[#373B44]">PO #</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Type</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Vendor</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">
                  Created By
                </th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Items</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Total</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Due</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Status</th>
                <th className="px-5 py-3 font-semibold text-[#373B44]">Created</th>
                <th className="px-5 py-3 text-right font-semibold text-[#373B44]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8eaed]">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-[#8b95a5]">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading purchase orders...
                    </span>
                  </td>
                </tr>
              ) : purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-[#8b95a5]">
                    No purchase orders found. Create your first order to get
                    started.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map(po => (
                  <tr key={po.id} className="transition-colors hover:bg-[#f8f9fb]">
                    <td className="px-5 py-3.5 font-semibold text-[#373B44]">
                      {po.po_number}
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {formatOrderType(po.order_type)}
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {formatVendorDisplay(po)}
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {po.created_by_name ?? `#${po.created_by}`}
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {po.items?.length ?? 0}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#373B44]">
                      {formatCurrency(po.total_amount)}
                    </td>
                    <td className="px-5 py-3.5 text-[#5c6370]">
                      {formatCurrency(po.due_amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                          getStatusBadgeClass(po.status)
                        )}
                      >
                        {formatStatus(po.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#8b95a5]">
                      {formatDate(po.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          href={`/purchase-orders/${po.id}`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" })
                          )}
                        >
                          <Eye />
                          View
                        </Link>

                        {canManagePurchaseOrder(po.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(po)}
                          >
                            <Pencil />
                            Edit
                          </Button>
                        )}

                        {canApprovePurchaseOrder(authUser, po.status) && (
                          <Button
                            size="sm"
                            className="bg-[#4DC591] hover:bg-[#3db37f]"
                            onClick={() => {
                              setPoToApprove(po)
                              setFormError(null)
                              setApproveOpen(true)
                            }}
                          >
                            <CheckCircle2 />
                            Approve
                          </Button>
                        )}

                        {canReceivePurchaseOrder(authUser, po.status) && (
                          <Link
                            href={`/procurement/po-receiving/${po.id}`}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                          >
                            <PackageCheck />
                            Receive
                          </Link>
                        )}

                        {canCancelPurchaseOrder(po.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPoToCancel(po)
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
                            setPoToDelete(po)
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

      <PurchaseOrderFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        purchaseOrder={selectedPo}
        items={items}
        units={units}
        vendors={vendors}
        onSuccess={refreshAll}
        onCreated={created =>
          router.push(`/purchase-orders/${created.id}?voucher=1`)
        }
      />

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Purchase Order</DialogTitle>
            <DialogDescription>
              Approve {poToApprove?.po_number}? This confirms the order for
              procurement.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <DialogBody>
              <p className="text-sm text-red-600">{formError}</p>
            </DialogBody>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)} disabled={isSubmitting}>
              Close
            </Button>
            <Button className="bg-[#4DC591] hover:bg-[#3db37f]" onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Purchase Order</DialogTitle>
            <DialogDescription>
              Cancel {poToCancel?.po_number}? It will be marked as cancelled.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <DialogBody>
              <p className="text-sm text-red-600">{formError}</p>
            </DialogBody>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={isSubmitting}>
              Keep Active
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isSubmitting}>
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
              Permanently delete {poToDelete?.po_number}, all line items, and
              any attachment.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </div>
          <SheetFooter className="px-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Delete
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
