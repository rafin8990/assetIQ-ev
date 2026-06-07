import type { Metadata } from "next"
import { Package } from "lucide-react"

import { PagePlaceholder } from "@/components/dashboard/page-placeholder"

export const metadata: Metadata = { title: "Stock" }

export default function StockPage() {
  return (
    <PagePlaceholder
      title="Stock"
      description="Monitor stock levels and warehouse inventory."
      icon={Package}
    />
  )
}
