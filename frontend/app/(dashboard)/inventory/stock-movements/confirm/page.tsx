import type { Metadata } from "next"

import { StockMovementConfirmPageClient } from "@/components/stock-movements/stock-movement-confirm-page-client"

export const metadata: Metadata = { title: "Destination Confirm" }

export default function StockMovementConfirmPage() {
  return <StockMovementConfirmPageClient />
}
