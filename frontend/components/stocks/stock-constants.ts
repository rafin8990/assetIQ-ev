import { PERMISSION_ACTION_MANAGE_STOCK } from "@/config/permissions"
import { hasPermission } from "@/lib/auth/permissions"
import type { User } from "@/types/users"

export const selectClassName =
  "flex h-9 w-full rounded-md border border-[#e8eaed] bg-white px-3 py-1 text-sm text-[#373B44] outline-none focus:border-[#4DC591] focus:ring-2 focus:ring-[#4DC591]/20"

export function canManageStock(
  user: Pick<User, "role" | "permissions"> | null | undefined
) {
  return hasPermission(user, PERMISSION_ACTION_MANAGE_STOCK)
}
