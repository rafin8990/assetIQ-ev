import type { Metadata } from "next"
import { ShoppingCart } from "lucide-react"

import { PagePlaceholder } from "@/components/dashboard/page-placeholder"

export const metadata: Metadata = { title: "Purchase Orders" }

export default function PurchaseOrdersPage() {
  return (
    <PagePlaceholder
      title="Purchase Orders"
      description="Track and manage purchase orders."
      icon={ShoppingCart}
    />
  )
}
