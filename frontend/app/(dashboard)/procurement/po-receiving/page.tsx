import type { Metadata } from "next"

import { PoReceivingListPageClient } from "@/components/purchase-orders/po-receiving-list-page-client"

export const metadata: Metadata = { title: "PO Receiving" }

export default function PoReceivingPage() {
  return <PoReceivingListPageClient />
}
