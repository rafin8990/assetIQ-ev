import type { Metadata } from "next"

import { AdminsPageClient } from "@/components/users/admins-page-client"

export const metadata: Metadata = { title: "Admin Management" }

export default function AdminsPage() {
  return <AdminsPageClient />
}
