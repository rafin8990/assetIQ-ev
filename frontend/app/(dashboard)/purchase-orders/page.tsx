import type { Metadata } from "next"

import { PurchaseOrdersPageClient } from "@/components/purchase-orders/purchase-orders-page-client"

export const metadata: Metadata = { title: "Purchase Orders" }

export default function PurchaseOrdersPage() {
  return <PurchaseOrdersPageClient />
}
