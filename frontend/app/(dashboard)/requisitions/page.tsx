import type { Metadata } from "next"
import { ClipboardList } from "lucide-react"

import { PagePlaceholder } from "@/components/dashboard/page-placeholder"

export const metadata: Metadata = { title: "Requisitions" }

export default function RequisitionsPage() {
  return (
    <PagePlaceholder
      title="Requisitions"
      description="Create and track material requisitions."
      icon={ClipboardList}
    />
  )
}
