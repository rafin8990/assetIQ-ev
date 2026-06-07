import type { Metadata } from "next"

import { AddUserPageClient } from "@/components/users/add-user-page-client"

export const metadata: Metadata = { title: "Add User" }

export default function AddUserPage() {
  return <AddUserPageClient />
}
