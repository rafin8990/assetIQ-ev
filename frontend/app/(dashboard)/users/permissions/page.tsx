import type { Metadata } from "next"

import { UserPermissionsPageClient } from "@/components/users/user-permissions-page-client"

export const metadata: Metadata = { title: "User Permissions" }

export default function UserPermissionsPage() {
  return <UserPermissionsPageClient />
}
