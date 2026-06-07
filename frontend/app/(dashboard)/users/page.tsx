import type { Metadata } from "next"

import { UsersPageClient } from "@/components/users/users-page-client"

export const metadata: Metadata = { title: "List of User" }

export default function UsersPage() {
  return <UsersPageClient />
}
