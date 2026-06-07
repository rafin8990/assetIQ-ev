import type { Metadata } from "next"
import { Hash } from "lucide-react"

import { PagePlaceholder } from "@/components/dashboard/page-placeholder"

export const metadata: Metadata = { title: "PO Code" }

export default function PoCodePage() {
  return (
    <PagePlaceholder
      title="PO Code"
      description="Manage purchase order codes and references."
      icon={Hash}
    />
  )
}
