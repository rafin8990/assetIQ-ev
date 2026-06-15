import type { Metadata } from "next"

import { StockMovementApprovalPageClient } from "@/components/stock-movements/stock-movement-approval-page-client"

export const metadata: Metadata = { title: "Movement Approval" }

export default function StockMovementApprovalPage() {
  return <StockMovementApprovalPageClient />
}
