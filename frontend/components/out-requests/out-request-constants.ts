import {
  PERMISSION_ACTION_APPROVE_OUT_REQUEST,
  PERMISSION_ACTION_DELETE_ANY_OUT_REQUEST,
  PERMISSION_ACTION_PROCESS_OUT,
} from "@/config/permissions"
import { hasPermission } from "@/lib/auth/permissions"
import type { OutRequestItem, OutRequestStatus } from "@/types/out-requests"
import type { User } from "@/types/users"

export const selectClassName =
  "flex h-9 w-full rounded-md border border-[#e8eaed] bg-white px-3 py-1 text-sm text-[#373B44] outline-none focus:border-[#4DC591] focus:ring-2 focus:ring-[#4DC591]/20"

export const textareaClassName =
  "flex min-h-24 w-full rounded-md border border-[#e8eaed] bg-white px-3 py-2 text-sm text-[#373B44] outline-none focus:border-[#4DC591] focus:ring-2 focus:ring-[#4DC591]/20"

export const STATUS_TABS: {
  label: string
  value: OutRequestStatus | "all"
}[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Out", value: "out" },
  { label: "Cancelled", value: "cancelled" },
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

export function formatStatus(status: OutRequestStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function formatItemStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function getStatusBadgeClass(status: OutRequestStatus) {
  switch (status) {
    case "approved":
      return "bg-[#e8f8f0] text-[#2d9f6f]"
    case "out":
      return "bg-blue-50 text-blue-700"
    case "cancelled":
      return "bg-red-50 text-red-600"
    default:
      return "bg-amber-50 text-amber-700"
  }
}

export function getItemStatusBadgeClass(status: string) {
  switch (status) {
    case "out":
      return "bg-blue-50 text-blue-700"
    case "partial":
      return "bg-violet-50 text-violet-700"
    default:
      return "bg-amber-50 text-amber-700"
  }
}

export function canManageOutRequest(status: OutRequestStatus) {
  return status === "pending"
}

export function canProcessOutRequest(status: OutRequestStatus) {
  return status === "approved"
}

export function canProcessOutRequestWithPermission(
  user: Pick<User, "role" | "permissions"> | null | undefined,
  status: OutRequestStatus
) {
  return (
    canProcessOutRequest(status) &&
    hasPermission(user, PERMISSION_ACTION_PROCESS_OUT)
  )
}

export function getRemainingOutQuantity(item: OutRequestItem) {
  return Math.max(
    0,
    Number(item.requested_quantity) - Number(item.out_quantity ?? 0)
  )
}

export function canOutItem(item: OutRequestItem) {
  return item.status !== "out" && getRemainingOutQuantity(item) > 0
}

export function canApproveOutRequest(
  user: Pick<User, "role" | "permissions"> | null | undefined,
  status: OutRequestStatus
) {
  return (
    hasPermission(user, PERMISSION_ACTION_APPROVE_OUT_REQUEST) &&
    status === "pending"
  )
}

export function canDeleteOutRequest(
  user: Pick<User, "role" | "permissions"> | null | undefined
) {
  return hasPermission(user, PERMISSION_ACTION_DELETE_ANY_OUT_REQUEST)
}

export function canDeleteOutRequestRow(
  user: Pick<User, "role" | "permissions"> | null | undefined,
  status: OutRequestStatus,
  isOwner: boolean
) {
  if (canDeleteOutRequest(user)) return true
  return isOwner && canManageOutRequest(status)
}
