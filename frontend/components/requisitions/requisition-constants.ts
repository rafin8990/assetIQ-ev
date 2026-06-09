import { PERMISSION_ACTION_APPROVE_REQUISITION } from "@/config/permissions"
import { hasPermission } from "@/lib/auth/permissions"
import type { RequisitionStatus } from "@/types/requisitions"
import type { User } from "@/types/users"

export const selectClassName =
  "flex h-9 w-full rounded-md border border-[#e8eaed] bg-white px-3 py-1 text-sm text-[#373B44] outline-none focus:border-[#4DC591] focus:ring-2 focus:ring-[#4DC591]/20"

export const textareaClassName =
  "flex min-h-24 w-full rounded-md border border-[#e8eaed] bg-white px-3 py-2 text-sm text-[#373B44] outline-none focus:border-[#4DC591] focus:ring-2 focus:ring-[#4DC591]/20"

export const STATUS_TABS: { label: string; value: RequisitionStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Ordered", value: "ordered" },
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

export function formatStatus(status: RequisitionStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function getStatusBadgeClass(status: RequisitionStatus) {
  switch (status) {
    case "approved":
      return "bg-[#e8f8f0] text-[#2d9f6f]"
    case "ordered":
      return "bg-blue-50 text-blue-700"
    case "cancelled":
      return "bg-red-50 text-red-600"
    default:
      return "bg-amber-50 text-amber-700"
  }
}

export function canManageRequisition(status: RequisitionStatus) {
  return status === "pending"
}

export function canApproveRequisition(
  user: Pick<User, "role" | "permissions"> | null | undefined,
  status: RequisitionStatus
) {
  return (
    hasPermission(user, PERMISSION_ACTION_APPROVE_REQUISITION) &&
    status === "pending"
  )
}
