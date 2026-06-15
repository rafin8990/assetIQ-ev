import {
  PERMISSION_ACTION_APPROVE_PURCHASE_ORDER,
  PERMISSION_ACTION_RECEIVE_PURCHASE_ORDER,
} from "@/config/permissions"
import { hasPermission } from "@/lib/auth/permissions"
import type {
  PoItemPayload,
  PurchaseOrderStatus,
  PurchaseOrderType,
} from "@/types/purchase-orders"
import type { User } from "@/types/users"

export const selectClassName =
  "flex h-9 w-full rounded-md border border-[#e8eaed] bg-white px-3 py-1 text-sm text-[#373B44] outline-none focus:border-[#4DC591] focus:ring-2 focus:ring-[#4DC591]/20"

export const textareaClassName =
  "flex min-h-24 w-full rounded-md border border-[#e8eaed] bg-white px-3 py-2 text-sm text-[#373B44] outline-none focus:border-[#4DC591] focus:ring-2 focus:ring-[#4DC591]/20"

export const STATUS_TABS: {
  label: string
  value: PurchaseOrderStatus | "all"
}[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "In Staging", value: "in_staging" },
  { label: "Partial", value: "partially_received" },
  { label: "Fully Received", value: "fully_received" },
  { label: "Received", value: "received" },
  { label: "Cancelled", value: "cancelled" },
]

export const STAGING_STATUS_TABS: {
  label: string
  value: "all" | "approved" | "in_staging" | "partially_received" | "fully_received"
}[] = [
  { label: "All", value: "all" },
  { label: "Approved", value: "approved" },
  { label: "In Staging", value: "in_staging" },
  { label: "Partial", value: "partially_received" },
  { label: "Fully Received", value: "fully_received" },
]

export const ORDER_TYPE_OPTIONS: {
  label: string
  value: PurchaseOrderType
}[] = [
  { label: "By Requisition", value: "by_requisition" },
  { label: "Direct", value: "direct" },
]

export function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatStatus(status: PurchaseOrderStatus) {
  switch (status) {
    case "in_staging":
      return "In Staging"
    case "partially_received":
      return "Partially Received"
    case "fully_received":
      return "Fully Received"
    default:
      return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

export function formatOrderType(type: PurchaseOrderType) {
  return type === "by_requisition" ? "By Requisition" : "Direct"
}

export function formatVendorDisplay(po: {
  vendor_name?: string | null
  vendor_company_name?: string | null
  vendor_id?: number | null
}) {
  if (po.vendor_name) {
    return po.vendor_company_name
      ? `${po.vendor_name} (${po.vendor_company_name})`
      : po.vendor_name
  }

  return po.vendor_id ? `Vendor #${po.vendor_id}` : "—"
}

export function formatCurrency(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return "—"
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount))
}

export function getStatusBadgeClass(status: PurchaseOrderStatus) {
  switch (status) {
    case "approved":
      return "bg-[#e8f8f0] text-[#2d9f6f]"
    case "in_staging":
      return "bg-purple-50 text-purple-700"
    case "partially_received":
      return "bg-amber-50 text-amber-700"
    case "fully_received":
      return "bg-teal-50 text-teal-700"
    case "received":
      return "bg-blue-50 text-blue-700"
    case "cancelled":
      return "bg-red-50 text-red-600"
    default:
      return "bg-amber-50 text-amber-700"
  }
}

export function canManagePurchaseOrder(status: PurchaseOrderStatus) {
  return status === "pending"
}

export function canApprovePurchaseOrder(
  user: Pick<User, "role" | "permissions"> | null | undefined,
  status: PurchaseOrderStatus
) {
  return (
    hasPermission(user, PERMISSION_ACTION_APPROVE_PURCHASE_ORDER) &&
    status === "pending"
  )
}

export function canReceivePurchaseOrder(
  user: Pick<User, "role" | "permissions"> | null | undefined,
  status: PurchaseOrderStatus
) {
  return (
    hasPermission(user, PERMISSION_ACTION_RECEIVE_PURCHASE_ORDER) &&
    (status === "approved" ||
      status === "in_staging" ||
      status === "partially_received")
  )
}

export function canCancelPurchaseOrder(status: PurchaseOrderStatus) {
  return status === "pending" || status === "approved"
}

export function calculatePoItemTotal(item: {
  quantity: number
  per_unit_amount?: number | null
  discount_amount?: number | null
}) {
  const perUnit = item.per_unit_amount ?? 0
  const lineSubtotal = perUnit * item.quantity
  const lineDiscount = item.discount_amount ?? 0
  return Math.max(0, lineSubtotal - lineDiscount)
}

export function calculatePurchaseOrderAmounts(
  items: PoItemPayload[],
  headerDiscount?: number | null,
  paidAmount?: number | null
) {
  const itemsSubtotal = items.reduce(
    (sum, item) => sum + calculatePoItemTotal(item),
    0
  )
  const discount = headerDiscount ?? 0
  const totalAmount = Math.max(0, itemsSubtotal - discount)
  const paid = paidAmount ?? 0
  const dueAmount = Math.max(0, totalAmount - paid)

  return {
    total_amount: totalAmount,
    paid_amount: paid,
    due_amount: dueAmount,
    discount_amount: discount,
  }
}
