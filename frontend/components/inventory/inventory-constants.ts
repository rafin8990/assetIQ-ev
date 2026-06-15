import {
  PERMISSION_ACTION_MANAGE_STOCK,
  PERMISSION_ACTION_STOCK_MOVEMENTS_APPROVE,
  PERMISSION_ACTION_STOCK_MOVEMENTS_CONFIRM,
  PERMISSION_ACTION_STOCK_MOVEMENTS_READY,
  PERMISSION_ACTION_STOCK_MOVEMENTS_TRANSFER,
} from "@/config/permissions"
import { hasPermission } from "@/lib/auth/permissions"
import type { User } from "@/types/users"
import type { StockMovementStatus } from "@/types/stock-movements"

export const selectClassName =
  "flex h-9 w-full rounded-md border border-[#e8eaed] bg-white px-3 py-1 text-sm text-[#373B44] outline-none focus:border-[#4DC591] focus:ring-2 focus:ring-[#4DC591]/20"

export function formatQuantity(value: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(Number(value))
}

export function formatVendorDisplay(
  vendorName?: string | null,
  companyName?: string | null
) {
  if (vendorName && companyName) return `${vendorName} (${companyName})`
  return vendorName ?? companyName ?? "Unknown vendor"
}

export function canManageStock(
  user: Pick<User, "role" | "permissions"> | null | undefined
) {
  return hasPermission(user, PERMISSION_ACTION_MANAGE_STOCK)
}

export function canApproveStockMovement(
  user: Pick<User, "role" | "permissions"> | null | undefined
) {
  return hasPermission(user, PERMISSION_ACTION_STOCK_MOVEMENTS_APPROVE)
}

export function canReadyStockMovement(
  user: Pick<User, "role" | "permissions"> | null | undefined
) {
  return hasPermission(user, PERMISSION_ACTION_STOCK_MOVEMENTS_READY)
}

export function canTransferStockMovement(
  user: Pick<User, "role" | "permissions"> | null | undefined
) {
  return hasPermission(user, PERMISSION_ACTION_STOCK_MOVEMENTS_TRANSFER)
}

export function canConfirmStockMovement(
  user: Pick<User, "role" | "permissions"> | null | undefined
) {
  return hasPermission(user, PERMISSION_ACTION_STOCK_MOVEMENTS_CONFIRM)
}

export const STOCK_MOVEMENT_STATUS_LABELS: Record<StockMovementStatus, string> =
  {
    pending: "Pending",
    approved: "Approved",
    ready: "Ready",
    in_transit: "In Transit",
    completed: "Completed",
    cancelled: "Cancelled",
  }

export function getMovementStatusBadgeClass(status: StockMovementStatus) {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-700"
    case "approved":
      return "bg-blue-50 text-blue-700"
    case "ready":
      return "bg-indigo-50 text-indigo-700"
    case "in_transit":
      return "bg-purple-50 text-purple-700"
    case "completed":
      return "bg-emerald-50 text-emerald-700"
    case "cancelled":
      return "bg-gray-100 text-gray-600"
    default:
      return "bg-gray-100 text-gray-600"
  }
}
