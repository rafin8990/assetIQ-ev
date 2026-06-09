import {
  PERMISSION_ACTION_APPROVE_RETURN,
  PERMISSION_ACTION_DELETE_ANY_RETURN,
} from "@/config/permissions"
import { hasPermission, isSuperAdmin } from "@/lib/auth/permissions"
import type { ReturnRequestStatus } from "@/types/returns"
import type { User } from "@/types/users"

export const selectClassName =
  "flex h-9 w-full rounded-md border border-[#e8eaed] bg-white px-3 py-1 text-sm text-[#373B44] outline-none focus:border-[#4DC591] focus:ring-2 focus:ring-[#4DC591]/20"

export const textareaClassName =
  "flex min-h-24 w-full rounded-md border border-[#e8eaed] bg-white px-3 py-2 text-sm text-[#373B44] outline-none focus:border-[#4DC591] focus:ring-2 focus:ring-[#4DC591]/20"

export const STATUS_TABS: {
  label: string
  value: ReturnRequestStatus | "all"
}[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
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

export function formatStatus(status: ReturnRequestStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function getStatusBadgeClass(status: ReturnRequestStatus) {
  switch (status) {
    case "approved":
      return "bg-[#e8f8f0] text-[#2d9f6f]"
    case "cancelled":
      return "bg-red-50 text-red-600"
    default:
      return "bg-amber-50 text-amber-700"
  }
}

export function canManageReturn(status: ReturnRequestStatus) {
  return status === "pending"
}

export function canApproveReturn(
  user: Pick<User, "role" | "permissions"> | null | undefined,
  status: ReturnRequestStatus
) {
  return (
    hasPermission(user, PERMISSION_ACTION_APPROVE_RETURN) && status === "pending"
  )
}

export function canDeleteReturn(
  user: Pick<User, "role" | "permissions"> | null | undefined
) {
  return hasPermission(user, PERMISSION_ACTION_DELETE_ANY_RETURN)
}

export function canDeleteReturnRow(
  user: Pick<User, "role" | "permissions"> | null | undefined,
  status: ReturnRequestStatus,
  isOwner: boolean
) {
  if (canDeleteReturn(user)) return true
  return isOwner && canManageReturn(status)
}

export function isAdminRole(user: Pick<User, "role"> | null | undefined) {
  return isSuperAdmin(user) || user?.role === "admin"
}
