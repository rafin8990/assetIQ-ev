import type {
  PoItemPayload,
  PurchaseOrderStatus,
  PurchaseOrderType,
} from "@/types/purchase-orders"

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
  { label: "Received", value: "received" },
  { label: "Cancelled", value: "cancelled" },
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
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function formatOrderType(type: PurchaseOrderType) {
  return type === "by_requisition" ? "By Requisition" : "Direct"
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
  role: string | undefined,
  status: PurchaseOrderStatus
) {
  return (
    (role === "admin" || role === "super_admin") && status === "pending"
  )
}

export function canReceivePurchaseOrder(
  role: string | undefined,
  status: PurchaseOrderStatus
) {
  return (
    (role === "admin" || role === "super_admin") && status === "approved"
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
